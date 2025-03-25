import { Managers } from "@/constants/Managers";
import { AppState, BaseManager, Logger, LogLevel } from "../BaseManager";
import { AuthManagerId } from "../auth/Exports";

export type ManagerStates = {
  managers: { [id: string]: { state: AppState; manager: BaseManager } };
  state: AppState;
  refreshAppState(): AppState;
};
export class AppStateManager {
  appState: AppState = AppState.Loading;
  refreshAppState() {
    let appState = AppState.Created;
    Object.keys(this.states.managers).forEach((x) => {
      const managerState = this.states.managers[x].state;
      if (x == AuthManagerId) appState |= managerState;
      else if (managerState > appState) appState = managerState;
    });

    this.appState = appState;
    return appState;
  }

  private states: ManagerStates = {
    managers: {},
    state: this.appState,
    refreshAppState: this.refreshAppState,
  };
  getStates() {
    return this.states;
  }

  private updateState: React.Dispatch<React.SetStateAction<ManagerStates>> =
    null!;
  private static readonly logger = new Logger("AppStateManager(base)");
  private readonly logLevel;

  constructor(logLevel: LogLevel) {
    // Instancing managers
    for (let i = 0; i < Managers.length; i++) {
      this.states.managers[Managers[i].id] = {
        state: Managers[i].state,
        manager: Managers[i].manager,
      };
    }

    this.logLevel = logLevel;
    AppStateManager.logger._setLogLevel(logLevel);
  }

  async initializeAsync(
    setStates: React.Dispatch<React.SetStateAction<ManagerStates>>
  ): Promise<AppState> {
    this.updateState = setStates;

    // Initializing managers
    for (let i = 0; i < Managers.length; i++) {
      const currentId = Managers[i].id;

      if (Managers[i].waitForInitialization) {
        this.states.managers[currentId].state = await this.states.managers[
          currentId
        ].manager.initializeAsync(this.logLevel, (state) =>
          this.updateManagerState(currentId, state)
        );
      } else {
        this.states.managers[currentId].manager
          .initializeAsync(this.logLevel, (state) =>
            this.updateManagerState(currentId, state)
          )
          .then((result) => {
            this.states.managers[currentId].state = result;
          })
          .catch((e) => {
            throw e;
          });
      }
    }

    this.refreshStates();
    return this.appState;
  }

  updateManagerState(id: string, state: AppState) {
    this.states.managers[id].state = state;
    this.refreshStates();
  }

  refreshStates() {
    AppStateManager.logger.debug("State before refresh", this.appState);
    this.refreshAppState();
    this.updateState({ ...this.states, state: this.appState.valueOf() });
    AppStateManager.logger.debug("States refreshed:", this.appState);
  }
}

export { BaseManager, AppState, Logger, LogLevel };
