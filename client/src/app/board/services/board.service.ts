import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SocketService } from 'src/app/shared/services/socket.service';
import { BoardInterface } from 'src/app/shared/types/board.interface';
import { SocketEventsEnum } from 'src/app/shared/types/socketEvents.enum';
import { ColumnInterface } from '../../shared/types/column.interface';
import { TaskInterface } from '../../shared/types/task.interface';

@Injectable()
export class BoardService {
  board$ = new BehaviorSubject<BoardInterface | null>(null);
  columns$ = new BehaviorSubject<ColumnInterface[]>([]);
  tasks$ = new BehaviorSubject<TaskInterface[]>([]);

  constructor(private socketService: SocketService) {}

  setBoard(board: BoardInterface): void {
    this.board$.next(board);
  }

  leaveBoard(boardId: string): void {
    this.board$.next(null);
    this.socketService.emit(SocketEventsEnum.boardsLeave, { boardId });
  }

  setColumns(columns: ColumnInterface[]): void {
    this.columns$.next(columns);
  }

  addColumn(column: ColumnInterface): void {
    const updatedColumns = [...this.columns$.getValue(), column];
    this.columns$.next(updatedColumns);
  }

  addTask(task: TaskInterface): void {
    const updatedTasks = [...this.tasks$.getValue(), task];
    this.tasks$.next(updatedTasks);
  }

  setTasks(tasks: TaskInterface[]): void {
    this.tasks$.next(tasks);
  }

  updateBoard(updatedBoard: BoardInterface): void {
    const board = this.board$.getValue();
    if (!board) {
      throw new Error('Board is not initialized');
    }
    this.board$.next({ ...board, title: updatedBoard.title });
  }

  ////In the code you provided, this.columns$ is a BehaviorSubject
  // that holds the current state of the columns. When getValue()
  // is called on this.columns$, it returns the current state of
  // the columns as an array. This array is then mapped using the
  // map method, with each column being checked if its id matches
  // the id of the updated column. If it does match, a new object
  // is returned using the spread operator ...column to copy all properties
  // of the original column, but with an updated title property.
  // If it doesn't match, the original column is returned. Finally,
  // the next method is called on this.columns$ with the updated array of columns,
  // effectively updating the state of the BehaviorSubject.
  //The map function is a native Javascript array method and not an RxJS operator,
  // so it can be used without calling pipe.
  updateColumn(updatedColumn: ColumnInterface): void {
    const updatedColumns = this.columns$.getValue().map((column) => {
      if (column.id === updatedColumn.id) {
        return { ...column, title: updatedColumn.title };
      }
      //If there is no match, it returns the original column.
      return column;
    });
    this.columns$.next(updatedColumns);
  }

  updateTask(updatedTask: TaskInterface): void {
    const updatedTasks = this.tasks$.getValue().map((task) => {
      if (task.id === updatedTask.id) {
        return {
          ...task,
          title: updatedTask.title,
          description: updatedTask.description,
          columnId: updatedTask.columnId,
        };
      }
      //If there is no match, it returns the original column.
      return task;
    });
    this.tasks$.next(updatedTasks);
  }

  deleteColumn(columnId: string): void {
    const updatedColumns = this.columns$
      .getValue()
      .filter((column) => column.id !== columnId);
    this.columns$.next(updatedColumns);
  }

  deleteTask(taskId: string): void {
    const updatedTasks = this.tasks$
      .getValue()
      .filter((task) => task.id !== taskId);
    this.tasks$.next(updatedTasks);
  }
}
