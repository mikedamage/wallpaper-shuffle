# Source this file from your ~/.zshrc to auto start wallpaper-shuffle
# when you open a shell. It will only run one instance.

function can-start-wps() {
    local wps_status="$(wallpaper-shuffle status)"
    local line_count="$(echo "$wps_status" | wc -l)"

    if [[ "$line_count" -gt "1" ]]; then
        return 1
    fi

    return 0
}

function start-wps() {
    if $(can-start-wps); then
        echo "Starting Wallpaper Shuffle..."
        wallpaper-shuffle start -n -d "$1" -i "10 minutes"
    fi
}

DIRECTORY="$HOME/Photos/Wallpaper" # Change this to your wallpaper directory
start-wps "$DIRECTORY"
