/**
 * d3 transition event names.
 */
export enum TransitionStatus {
    START = "start",
    END = "end",
    INTERRUPT = "interrupt"
}

export interface ITransitionEventData {
    transitionStatus: TransitionStatus;
    [propName: string]: any;
}

export const DefaultTransitionStartEvtData: ITransitionEventData = {
    transitionStatus: TransitionStatus.START
};

export const DefaultTransitionEndEvtData: ITransitionEventData = {
    transitionStatus: TransitionStatus.END
};

export const DefaultTransitionInterruptEvtData: ITransitionEventData = {
    transitionStatus: TransitionStatus.INTERRUPT 
}