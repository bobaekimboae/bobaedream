D=/mnt/user-data/uploads/autostudio_analysis/as24_100
cd /tmp/claude-0/-home-claude/9795e62c-2b83-5ed5-9b9a-75716025bfc2/scratchpad/skill
ls $D/$1_*.mp4 | xargs -P 4 -I{} sh -c 'n=$(basename {} .mp4); [ -f ev/$n/events.json ] || python3 detect.py {} ev/$n < /dev/null > /dev/null 2>&1 || echo fail $n'
echo DONE $1
