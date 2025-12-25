
export type TaskStatus = 'done' | 'building' | 'todo';

export interface Task {
  name: string;
  status: TaskStatus;
}

export interface StreamData {
  tasks: Task[];
}

export const INITIAL_DATA: StreamData = {
  tasks: [
    { name: "Auth system", status: "done" },
    { name: "API endpoints", status: "done" },
    { name: "Real-time sync", status: "building" },
    { name: "Deploy to prod", status: "todo" }
  ]
};
