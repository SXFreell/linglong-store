use std::process::Command;

pub mod executor;
pub mod network;
pub mod process;
pub mod install;
pub mod linglong;
pub mod linglong_env;
pub mod linglong_env_install;
pub(crate) mod linglong_env_parser;
pub mod prune;

// 重新导出 install 模块的公共 API，保持向后兼容
pub use install::{
    InstalledApp,
    install_linglong_app,
    cancel_linglong_install,
    get_installed_apps,
    uninstall_linglong_app,
    search_app_versions,
    run_linglong_app,
    create_desktop_shortcut,
};

pub(crate) const ENGLISH_LOCALE_ENV: [(&str, &str); 4] = [
    ("LC_ALL", "C.UTF-8"),
    ("LANG", "C.UTF-8"),
    ("LANGUAGE", "en_US"),
    ("LC_MESSAGES", "C.UTF-8"),
];

fn apply_english_locale_env_to_command(cmd: &mut Command) {
    for (key, value) in ENGLISH_LOCALE_ENV {
        cmd.env(key, value);
    }
}

/// Create an ll-cli Command with English locale enforced.
pub fn ll_cli_command() -> Command {
    let mut cmd = Command::new("ll-cli");
    apply_english_locale_env_to_command(&mut cmd);
    cmd
}

/// 创建异步 ll-cli Command（tokio），英文 locale 环境
pub fn ll_cli_async_command() -> tokio::process::Command {
    let mut cmd = tokio::process::Command::new("ll-cli");
    for (key, value) in ENGLISH_LOCALE_ENV {
        cmd.env(key, value);
    }
    cmd
}
