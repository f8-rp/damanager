clear

DIR="$(cd "$(dirname "$0")" && pwd)"

osascript <<EOF
tell application "Terminal"
    activate
    do script "cd '$DIR'; cd autoserverbot; npm run dev; exec $SHELL;"
    delay 1
    set miniaturized of front window to true
end tell
EOF

osascript <<EOF
tell application "Terminal"
    activate
    do script "cd '$DIR'; cd requesttestingdc; npm start; "exec $SHELL;"
    delay 1
    set miniaturized of front window to true
end tell
EOF



echo "----------------------"
echo "Front-end and Back-end Launched. To turn them off, quit all your terminals using Cmd+Q, AND TERMINATE ALL PROCESSES."
echo "----------------------"
echo "Website should be running at http://localhost:3000/"
echo "----------------------"
echo "Software by fate_007 <3"
echo "----------------------"
open "http://localhost:3000/"