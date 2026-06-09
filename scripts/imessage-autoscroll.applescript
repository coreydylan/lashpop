-- Auto-scroll a Messages conversation so offloaded iCloud attachments render
-- and download. Pair with scripts/imessage-harvest.py, which copies each image
-- out the instant it lands.
--
-- SETUP (one-time):
--   System Settings > Privacy & Security > Accessibility > enable your terminal
--   (Terminal / iTerm). Without this, keystrokes are silently dropped.
--
-- USAGE:
--   1. Open Messages, click into the target conversation (chat 41 = Emily +
--      the +17605195930 thread, where 67 of the 68 needed photos live).
--   2. In another window:  python3 scripts/imessage-harvest.py
--   3. Run this:           osascript scripts/imessage-autoscroll.applescript
--
-- It pages UP (into the Oct 2025-Feb 2026 window) pausing for downloads, then
-- pages back DOWN. Tune PAGES / PAUSE below. Move the mouse to a corner / Ctrl-C
-- the osascript to abort.

set PAGES to 120      -- how many Page-Up presses (each ~one screenful of history)
set PAUSE to 1.6      -- seconds between presses (give iCloud time to fetch)

tell application "Messages" to activate
delay 1

tell application "System Events"
  tell process "Messages"
    set frontmost to true
    -- click roughly in the middle of the transcript to focus the scroll area
    try
      set win to front window
      set {x, y} to position of win
      set {w, h} to size of win
      click at {x + (w * 0.6), y + (h * 0.5)}
    end try
    delay 0.5

    -- scroll UP into history
    repeat PAGES times
      key code 116 -- Page Up
      delay PAUSE
    end repeat

    delay 2
    -- ... and back DOWN to catch anything missed on the way up
    repeat PAGES times
      key code 121 -- Page Down
      delay (PAUSE * 0.6)
    end repeat
  end tell
end tell

display notification "Auto-scroll pass complete. Check the harvester progress." with title "iMessage recovery"
