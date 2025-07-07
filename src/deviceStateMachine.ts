import { DeviceStatus } from "@prisma/client";

// src/utils/deviceStateMachine.ts
type DeviceStatusTransition = {
    from: DeviceStatus;
    to: DeviceStatus[];
  };
  
  const allowedTransitions: DeviceStatusTransition[] = [
    { from: 'PENDING', to: ['ACTIVE', 'INACTIVE'] },
    { from: 'ACTIVE', to: ['INACTIVE', 'MAINTENANCE', 'DISCONNECTED'] },
    { from: 'INACTIVE', to: ['ACTIVE', 'MAINTENANCE'] },
    { from: 'MAINTENANCE', to: ['ACTIVE', 'INACTIVE'] },
    { from: 'DISCONNECTED', to: ['ACTIVE', 'INACTIVE', 'MAINTENANCE'] }
  ];
  
  export function isValidTransition(
    currentStatus: DeviceStatus,
    newStatus: DeviceStatus
  ): boolean {
    const transition = allowedTransitions.find(t => t.from === currentStatus);
    return transition ? transition.to.includes(newStatus) : false;
  }
  
  export function getNextValidStates(currentStatus: DeviceStatus): DeviceStatus[] {
    const transition = allowedTransitions.find(t => t.from === currentStatus);
    return transition ? transition.to : [];
  }