import PluginConfig from '../../example-plugin/plugin.json' assert { type: "json" };

export { PluginConfig }

export class Permissions {
    getPermissions(): PermissionState[] {
        return Object.keys(PluginConfig.permissions).map((permissionKey) => {
            return {
                name: permissionKey,
                granted: PluginConfig.permissions[permissionKey].isRequired ? true : false,
                canAskAgain: true
            }
        });
    }

    getDeclaredPermissions(): PermissionDeclaration[] {
        return Object.keys(PluginConfig.permissions).map((permissionKey) => {
            return {
                ...PluginConfig.permissions[permissionKey],
                name: permissionKey
            }
        })
    }

    requestPermissions(permissions: string[]): PermissionState[] {
        return permissions.map(x => ({
            name: x,
            granted: true,
            canAskAgain: true
        }))
    }
}

export interface PermissionDeclaration {
    name: string,
    description: string,
    isRequired: boolean
}

export interface PermissionState {
    name: string,
    granted: boolean,
    canAskAgain: boolean
}