# Everytime

***Time zones are hard. Everytime makes them easy!***

Everytime runs in the system tray and displays the current time local time in several time zones.

![example screencap](https://raw.githubusercontent.com/kiprobinson/everytime/master/screencap.jpg)

## Usage

Right-click on the Everytime logo in the system tray to see the current time in your selected time zones.

## Installation

### Windows / MacOS

1. [Download the latest binaries][binaries].
1. Unzip the archive to some local directory and run the Everytime file to launch the application.

### Linux

I've only tested this on Windows and MacOS. The Electron library that the app runs on should be cross-platform, but I have no means to test it. If you are interested, you can see the Development section below.

## Configuration

Right-click on the Everytime logo and select "Settings...". The application currently has the following settings:

* **Start on login**: If this is enabled, the application will launch as soon as you log in to the operating system. *Note: This option only works if you are running a compiled executable. If you are running from the command line, this option will have no effect.*

* **Time format**: You can choose to display times in 24-hour format (13:37) or 12-hour format (1:37 PM).

* **Offset display**: Beside each time zone, you can choose whether to display that time zone's offset against your local time zone or UTC, or you can choose both, or you can choose not to display the offset at all. For example, if you are in America/New_York, and you show times in Europe/Helsinki, the Helsinki time offset can be shown as "(UTC+0300)" or as "(Local+0700)".

* **Add/remove time zones**: This section lists the time zones you have selected to show (by default, this only includes UTC). You can add other time zones to this list.

## Development

I use [`pnpm`][pnpm] instead of `npm`. You can install it with `npm install -g pnpm`.

If you want to play around with this code, checkout the repo and then run `pnpm install`. Then you can issue the following commands:

* `pnpm run start`: This will launch the app in development mode.
* `pnpm run package-windows`: This will build binaries for 32- and 64-bit Windows architecture.
* `pnpm run package-mac`: This will build binaries MacOS.

## Support

If you have any questions or spot any issues, please open an issue on the GitHub page.


[binaries]: https://tilde.ampersand.space/everytime/dist
[pnpm]: https://pnpm.io/
