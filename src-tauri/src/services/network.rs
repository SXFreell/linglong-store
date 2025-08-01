use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::time::Instant;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkSpeed {
    pub upload_speed: u64,    // bytes per second
    pub download_speed: u64,  // bytes per second
}

// 实时网速监控配置
// const MIN_SAMPLING_INTERVAL: f64 = 0.5;      // 最小采样间隔（秒）
const MAX_SAMPLING_INTERVAL: f64 = 60.0;     // 最大采样间隔（1分钟）

// 基本异常值检测 - 仅过滤明显错误的数据
const MAX_REASONABLE_SPEED: u64 = 10_000_000_000; // 10GB/s
const MIN_REASONABLE_TIME_DIFF: f64 = 0.3; // 最小有效时间差（秒）

#[derive(Debug, Clone)]
struct NetworkData {
    stats: HashMap<String, (u64, u64)>, // (rx_bytes, tx_bytes)
    timestamp: Instant,
}

// 全局网络数据存储
static NETWORK_DATA: once_cell::sync::Lazy<Arc<Mutex<Option<NetworkData>>>> = 
    once_cell::sync::Lazy::new(|| Arc::new(Mutex::new(None)));

/// 获取实时网络速度
pub async fn get_network_speed() -> Result<NetworkSpeed, String> {
    match get_current_network_stats().await {
        Ok(current_stats) => {
            let now = Instant::now();
            let mut data = NETWORK_DATA.lock().unwrap();
            
            if let Some(ref mut network_data) = *data {
                let time_diff = now.duration_since(network_data.timestamp).as_secs_f64();
                
                // 检查采样间隔是否合理
                if time_diff >= MIN_REASONABLE_TIME_DIFF && time_diff <= MAX_SAMPLING_INTERVAL {
                    if let Some(speed) = calculate_realtime_speed(
                        &network_data.stats,
                        &current_stats,
                        time_diff,
                    ) {
                        // 更新数据
                        network_data.stats = current_stats;
                        network_data.timestamp = now;
                        
                        return Ok(speed);
                    }
                }
                
                // 采样间隔不合理，更新基线数据
                network_data.stats = current_stats;
                network_data.timestamp = now;
                
                // 返回0速度
                return Ok(NetworkSpeed {
                    upload_speed: 0,
                    download_speed: 0,
                });
            }
            
            // 首次调用，建立基线
            *data = Some(NetworkData {
                stats: current_stats,
                timestamp: now,
            });
            
            Ok(NetworkSpeed {
                upload_speed: 0,
                download_speed: 0,
            })
        }
        Err(e) => Err(format!("Failed to get network stats: {}", e)),
    }
}

/// 计算实时网络速度 - 无平滑处理
fn calculate_realtime_speed(
    last_stats: &HashMap<String, (u64, u64)>,
    current_stats: &HashMap<String, (u64, u64)>,
    time_diff: f64,
) -> Option<NetworkSpeed> {
    let mut total_rx_bytes = 0u64;
    let mut total_tx_bytes = 0u64;
    let mut valid_interfaces = 0;
    
    // 计算所有有效接口的流量差值
    for (interface, (current_rx, current_tx)) in current_stats {
        if let Some((last_rx, last_tx)) = last_stats.get(interface) {
            // 检查数据连续性（防止接口重置）
            if current_rx >= last_rx && current_tx >= last_tx {
                let rx_diff = current_rx - last_rx;
                let tx_diff = current_tx - last_tx;
                
                // 基本异常值过滤 - 只过滤明显不合理的数据
                let interface_rx_speed = (rx_diff as f64 / time_diff) as u64;
                let interface_tx_speed = (tx_diff as f64 / time_diff) as u64;
                
                // 只过滤超过物理极限的速度
                if interface_rx_speed <= MAX_REASONABLE_SPEED && 
                   interface_tx_speed <= MAX_REASONABLE_SPEED {
                    total_rx_bytes += rx_diff;
                    total_tx_bytes += tx_diff;
                    valid_interfaces += 1;
                }
            }
        }
    }
    
    // 需要至少一个有效接口
    if valid_interfaces == 0 {
        return None;
    }
    
    // 直接计算实时速度 - 不进行任何平滑处理
    let download_speed = (total_rx_bytes as f64 / time_diff) as u64;
    let upload_speed = (total_tx_bytes as f64 / time_diff) as u64;
    
    // 仅应用物理极限检查
    Some(NetworkSpeed {
        upload_speed: upload_speed.min(MAX_REASONABLE_SPEED),
        download_speed: download_speed.min(MAX_REASONABLE_SPEED),
    })
}

#[cfg(target_os = "linux")]
async fn get_current_network_stats() -> Result<HashMap<String, (u64, u64)>, Box<dyn std::error::Error>> {
    use std::fs;
    
    let content = fs::read_to_string("/proc/net/dev")?;
    let mut stats = HashMap::new();
    
    for line in content.lines().skip(2) { // 跳过前两行标题
        let parts: Vec<&str> = line.split_whitespace().collect();
        if parts.len() >= 10 {
            let interface = parts[0].trim_end_matches(':');
            // 跳过loopback接口
            if interface == "lo" {
                continue;
            }
            let rx_bytes: u64 = parts[1].parse().unwrap_or(0);
            let tx_bytes: u64 = parts[9].parse().unwrap_or(0);
            stats.insert(interface.to_string(), (rx_bytes, tx_bytes));
        }
    }
    
    Ok(stats)
}

#[cfg(not(target_os = "linux"))]
async fn get_current_network_stats() -> Result<HashMap<String, (u64, u64)>, Box<dyn std::error::Error>> {
    use systemstat::{System, Platform};
    
    let sys = System::new();
    let mut stats = HashMap::new();
    
    match sys.networks() {
        Ok(networks) => {
            for netif in networks.values() {
                let name = &netif.name;
                if name != "lo" && name != "loopback" {
                    stats.insert(name.clone(), (netif.stats.rx_bytes, netif.stats.tx_bytes));
                }
            }
        }
        Err(e) => return Err(Box::new(e)),
    }
    
    Ok(stats)
} 