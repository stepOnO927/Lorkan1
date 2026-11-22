# Lorkan1 cloud private room runner

The `Cloud private room AI` GitHub Actions workflow can keep 1–25 independent guest game clients on a GitHub runner instead of opening those pages on the owner's computer. It runs the published Lorkan decision bridge in isolated cloud browser contexts. This is **not a page-free protocol client**: the pages run in the cloud, where they consume runner memory. The owner stays in a separate, manually controlled account.

## Start

1. Create a **new, unstarted private** FrontWars room and stay in the lobby.
2. In this repository, create an Actions repository secret named `LORKAN_PRIVATE_ROOM` containing only the room code from the game URL. Do not put the code in a workflow input, source file, or issue because this repository is public.
3. In **Actions → Cloud private room AI → Run workflow**, select `ai_count` (1–25) and `max_minutes`.
4. Wait until the workflow log says `all_ai_armed` and shows the requested number `admitted` and `enabled`. Only then start the game from the owner's page.
5. Read the periodic `progress` counts. At the end, download the `private-room-report` artifact.

The runner checks that the room is private, has a present host and enough free seats. Each guest uses separate browser storage and its own server confirmed client ID. If all seats cannot be confirmed, the runner stops and closes them. A timeout or stopped workflow also closes its guest pages.

## What the report proves

`admitted` means FrontWars confirmed a guest seat. `enabled` means the Lorkan bridge accepted the start command. `spawned` means the client state reports a selected spawn. `totalSubmittedCommands` counts commands submitted through the game's client socket. The current extension reports `serverAcceptanceVerified: false`; submitted commands and wins need separate confirmation from server state and match results. No win rate is guaranteed.

GitHub hosted jobs have a finite duration. This workflow defaults to 90 minutes and has a 120 minute job limit. Starting a second run will queue behind the first one. If the room starts before all guests are admitted, the workflow stops; create a new private room and retry. Do not use this runner in rooms where automated guests are not permitted.

