using Microsoft.AspNetCore.Http;
using Socigy.Structures.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;

namespace Socigy.Middlewares.Helpers
{
    public static class UserAgentHelper
    {
        public static UserAgentDevice GetUserDeviceInfo(HttpContext context)
        {
            var ipString = context.Request.Headers.FirstOrDefault(x => x.Key.Equals("X-Real-IP", StringComparison.InvariantCultureIgnoreCase));
            var device = new UserAgentDevice()
            {
                Name = "Unknown Device",
                Type = DeviceType.Unknown,
                IP = ipString.Key == null ? context.Connection.RemoteIpAddress : IPAddress.Parse(ipString.Value!)
            };

            var clientInfo = UserAgentRecognizer.GetClientInfo(context);
            if (clientInfo == null)
                return device;

            if (clientInfo.String != null && clientInfo.String.Contains("Socigy"))
            {
                if (clientInfo.String.Contains("android", StringComparison.OrdinalIgnoreCase))
                {
                    device.Type |= DeviceType.Android;
                    device.Type |= DeviceType.Mobile;
                }

                if (clientInfo.String.Contains("Xiaomi", StringComparison.OrdinalIgnoreCase))
                {
                    device.Name = "Xiaomi";
                }

                if (clientInfo.String.Contains("Socigy", StringComparison.OrdinalIgnoreCase))
                {
                    if (device.Name != "Unknown Device")
                        device.Name += " - Socigy App";
                    else
                        device.Name = "Socigy App";
                    device.Type |= DeviceType.App;
                }

                return device;
            }

            if (clientInfo.OS.Family == "Other" && clientInfo.UA.Family == "Other")
                return device;
            else if (clientInfo.String.Contains("Socigy"))
            {
                var startIndex = (clientInfo.String.IndexOf("Socigy/") + 7);
                device.Name = $"{clientInfo.OS} - {clientInfo.Device} - Socigy {clientInfo.String[startIndex..clientInfo.String.IndexOf(' ', startIndex)]}";
            }
            else if (clientInfo.Device.Family == "Other")
                device.Name = $"{clientInfo.OS} - {clientInfo.UA}";
            else
                device.Name = $"{clientInfo.OS} - {clientInfo.Device} - {clientInfo.UA}";

            switch (clientInfo.OS.Family)
            {
                case "Windows":
                    device.Type = DeviceType.Windows;
                    break;

                case "Android":
                    device.Type = DeviceType.Android | DeviceType.Mobile;
                    break;

                case "iOS":
                    device.Type = DeviceType.IOS | DeviceType.Mobile;
                    break;

                case "Linux":
                    device.Type = DeviceType.Linux;
                    break;

                case "Mac OS X":
                    device.Type = DeviceType.MacOSx;
                    break;
            }

            switch (clientInfo.UA.Family)
            {
                case "Google":
                case "Chrome":
                    device.Type |= DeviceType.Chrome;
                    device.Type |= DeviceType.Browser;
                    break;

                case "IE":
                    device.Type |= DeviceType.Edge;
                    device.Type |= DeviceType.Browser;
                    break;

                case "Brave":
                    device.Type |= DeviceType.Brave;
                    device.Type |= DeviceType.Browser;
                    break;

                case "Safari":
                    device.Type |= DeviceType.Safari;
                    device.Type |= DeviceType.Browser;
                    break;

                case "Opera":
                case "Arc":
                    device.Type |= DeviceType.Browser;
                    break;
            }

            if (clientInfo.String.Contains("Socigy"))
            {
                device.Type |= DeviceType.App;
            }

            return device;
        }
    }
}
