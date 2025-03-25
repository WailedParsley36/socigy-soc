import PluginConfig from '../../example-plugin/plugin.json' assert { type: "json" };
export { PluginConfig };
export class Permissions {
    getPermissions() {
        return Object.keys(PluginConfig.permissions).map((permissionKey) => {
            return {
                name: permissionKey,
                granted: PluginConfig.permissions[permissionKey].isRequired ? true : false,
                canAskAgain: true
            };
        });
    }
    getDeclaredPermissions() {
        return Object.keys(PluginConfig.permissions).map((permissionKey) => {
            return Object.assign(Object.assign({}, PluginConfig.permissions[permissionKey]), { name: permissionKey });
        });
    }
    requestPermissions(permissions) {
        return permissions.map(x => ({
            name: x,
            granted: true,
            canAskAgain: true
        }));
    }
}
