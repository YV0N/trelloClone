import { Component, HostBinding, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BoardService } from '../../services/board.service';
import {
  combineLatest,
  filter,
  map,
  Observable,
  Subject,
  takeUntil,
} from 'rxjs';
import { TaskInterface } from '../../../shared/types/task.interface';
import { FormBuilder, FormControl } from '@angular/forms';
import { ColumnInterface } from '../../../shared/types/column.interface';
import { TasksService } from '../../../shared/services/tasks.service';
import { SocketEventsEnum } from '../../../shared/types/socketEvents.enum';
import { SocketService } from '../../../shared/services/socket.service';

@Component({
  selector: 'task-modal',
  templateUrl: 'taskModal.component.html',
})
export class TaskModalComponent implements OnDestroy {
  @HostBinding('class') classes = 'task-modal';

  boardId: string;
  taskId: string;
  task$: Observable<TaskInterface>;
  data$: Observable<{ task: TaskInterface; columns: ColumnInterface[] }>;
  columnForm = this.fb.group<{ columnId: FormControl<string | null> }>({
    columnId: new FormControl(null),
  });
  unsubscribe$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private boardService: BoardService,
    private fb: FormBuilder,
    private taskService: TasksService,
    private socketService: SocketService
  ) {
    const taskId = this.route.snapshot.paramMap.get('taskId');
    const boardId = this.route.parent?.snapshot.paramMap.get('boardId');

    if (!boardId) {
      throw new Error("Can't get boardID from url");
    }
    if (!taskId) {
      throw new Error("Can't get taskID from url");
    }

    this.taskId = taskId;
    this.boardId = boardId;
    this.task$ = this.boardService.tasks$.pipe(
      map((tasks) => {
        return tasks.find((task) => task.id === this.taskId);
      }),
      filter(Boolean)
    );
    this.data$ = combineLatest([this.task$, this.boardService.columns$]).pipe(
      map(([task, columns]) => ({
        task,
        columns,
      }))
    );
    this.task$.pipe(takeUntil(this.unsubscribe$)).subscribe((task) => {
      this.columnForm.patchValue({ columnId: task.columnId });
    });

    combineLatest([this.task$, this.columnForm.get('columnId')!.valueChanges])
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(([task, columnId]) => {
        console.log('Changed Column Id', columnId, task.columnId);
        if (task.columnId !== columnId) {
          this.taskService.updateTask(this.boardId, task.id, {
            columnId: columnId ?? '',
          });
        }
      });
    this.socketService
      .listen<string>(SocketEventsEnum.tasksDeleteSuccess)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(() => {
        this.goToBoard();
      });
  }

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  goToBoard() {
    this.router.navigate(['boards', this.boardId]);
  }

  updateTaskName(taskName: string) {
    this.taskService.updateTask(this.boardId, this.taskId, { title: taskName });
  }

  updateTaskDescription(taskDescription: string) {
    this.taskService.updateTask(this.boardId, this.taskId, {
      description: taskDescription,
    });
  }

  deleteTask() {
    this.taskService.deleteTask(this.boardId, this.taskId);
  }
}
