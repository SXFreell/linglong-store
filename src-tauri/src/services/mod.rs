use portable_pty::CommandBuilder;
use std::process::Command;

pub mod network;
pub mod process;
pub mod installed;
pub mod install_task;
pub mod linglong;
pub mod linglong_env;
pub mod prune;

const ENGLISH_LOCALE_ENV: [(&str, &str); 4] = [
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

fn apply_english_locale_env_to_command_builder(cmd: &mut CommandBuilder) {
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

/// Create an ll-cli CommandBuilder (for PTY) with English locale enforced.
pub fn ll_cli_pty_command() -> CommandBuilder {
    let mut cmd = CommandBuilder::new("ll-cli");
    apply_english_locale_env_to_command_builder(&mut cmd);
    cmd
}
