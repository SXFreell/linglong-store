/**
 * 解析玲珑唯一标识字符串
 * ref唯一标识的组成结构 ${repo}/${channel}:${id}/${version}/${arch}
 * deepin/main:org.deepin.calculator/1.2.2/x86_64
 * 默认 repo 为 deepin
 * 默认 channel 为 main
 * 支持格式：
 *   1. repo/channel:appId/version/arch
 *   2. channel:appId/version/arch
 *   3. appId/version/arch
 *   4. appId
 * 
 * @param ref 玲珑唯一标识字符串
 * @returns { repo, channel, appId, version, arch }
 */
export function ParseRef(ref: string) {
    // 如果 ref 为空或长度为0，返回默认值
    if (!ref || ref.length === 0) {
        return { repo: '', channel: '', appId: '', version: '', arch: '' };
    }
    // 初始化各属性为空字符串
    let repo = '',channel = '',appId = '',version = '',arch = '';
    // 包含 ':'，说明有 repo/channel 或 channel
    if (ref.includes(':')) {
        const [left, right] = ref.split(':');
        // ${repo}/${channel}
        const leftParts = left.split('/');
        if (leftParts.length > 1) {
            repo = leftParts[0];
            channel = leftParts[1];
        } else {
            channel = leftParts[0];
        }
        // ${id}/${version}/${arch}
        const rightParts = right.split('/');
        if (rightParts.length > 2) {
            appId = rightParts[0];
            version = rightParts[1];
            arch = rightParts[2];
        } else if (rightParts.length === 2) {
            appId = rightParts[0];
            version = rightParts[1];
        } else if (rightParts.length === 1) {
            appId = rightParts[0];
        }
        return { repo, channel, appId, version, arch };
    } 
    if (ref.includes('/')){
        const parts = ref.split('/');
        appId = parts[0];
        version = parts[1] || '';
        arch = parts[2] || '';
        return { repo, channel, appId, version, arch };
    } 
    
    appId = ref;
    return { repo, channel, appId, version, arch };
}