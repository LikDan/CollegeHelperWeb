import {Component, ElementRef, Host, HostListener, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {AppComponent} from "../../../app.component";
import {JournalService} from "../../../services/shared/journal.service";
import {Lesson} from "../../../models/schedule";
import {Journal, Mark} from "../../../models/journal";
import * as moment from "moment";
import {compareDates} from "../../../utils";

@Component({
  selector: 'app-login',
  templateUrl: './view.component.html',
  styleUrls: ['./view.component.scss']
})
export class JournalViewComponent implements OnInit {
  lessons: Lesson[] = []
  lessonTypes: string[] = ["Laboratory", "Practice", "General"]

  focusedCells: Point[] = []
  isCtrlPressed = false
  isShiftPressed = false

  selectedDate: Lesson | null

  collapseType?: moment.unitOfTime.StartOf

  @ViewChild("table") table: ElementRef

  constructor(private router: Router, @Host() private host: ElementRef, private parent: AppComponent, private route: ActivatedRoute, public journalService: JournalService) {
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      if (params["group"] == undefined || params["subject"] == undefined || params["teacher"] == undefined) return

      this.journalService.getJournal(params["group"], params["subject"], params["teacher"])
    })
  }

  focusCell(x: number, y: number) {
    let table = <HTMLTableElement>this.table.nativeElement

    console.log(x, y, this.focusedCells)

    if (this.focusedCells.length == 0) {
      table.tBodies[0].rows[0].cells[0].focus()
      return
    }

    let cell = table.tBodies[0].rows[y + this.focusedCells[0].y]?.cells[x + this.focusedCells[0].x]
    cell?.focus()
  }

  isFocused(x: number, y: number): boolean {
    return this.focusedCells.find(value => value.x == x && value.y == y) != undefined
  }

  addFocusedPoint(point: Point) {
    if (this.isFocused(point.x, point.y)) {
      this.focusedCells = this.focusedCells.filter(value => value.x != point.x || value.y != point.y)
      return
    }

    this.focusedCells.push(point)
  }

  focus(cell: HTMLTableCellElement, x: number, y: number, lesson: Lesson, studentID: string, journal: Journal) {
    let cellX = cell.getClientRects()[0].x
    let cellY = cell.getClientRects()[0].y
    this.host.nativeElement.scrollBy(cellX < 180 ? cellX - 180 : 0, cellY < 120 ? cellY - 120 : 0)

    if (journal.info.editable && this.isShiftPressed && this.focusedCells.length > 0) {
      let previousPoint = this.focusedCells[this.focusedCells.length - 1]
      this.addFocusedPoint(previousPoint)

      let ex = x
      let ey = y
      let sx = previousPoint.x
      let sy = previousPoint.y

      if (sx > ex) ex--
      else ex++

      if (sy > ey) ey--
      else ey++

      for (let x1 = sx; x1 != ex; ex > x1 ? x1++ : x1--) {
        for (let y1 = sy; y1 != ey; ey > y1 ? y1++ : y1--) {
          let row = journal.rows[y1]
          let lesson = row.lessons[x1]

          if (this.isFocused(x, y) == this.isFocused(x1, y1))
            this.addFocusedPoint({x: x1, y: y1, lesson: lesson, studentID: row.id})
        }
      }

      return
    }

    if (journal.info.editable && this.isCtrlPressed) {
      this.addFocusedPoint({x: x, y: y, lesson: lesson, studentID: studentID})
      return
    }

    this.focusedCells = [{x: x, y: y, lesson: lesson, studentID: studentID}]
  }

  markAdd(mark: Mark) {
    this.focusedCells.forEach(value => {
      let mark_ = {
        mark: mark.mark,
        lessonId: value.lesson.id,
        studentID: value.studentID,
        studyPlaceId: mark.studyPlaceId
      }

      this.journalService.addMark(mark_).subscribe({
        next: m => {
          if (value.lesson.marks == null)
            value.lesson.marks = [m]
          else
            value.lesson.marks?.push(m)
        }
      })
    })
  }

  markEdit(mark: Mark) {
    this.journalService.editMark(mark).subscribe({
      next: m => {
        mark.mark = m.mark
      }
    })
  }

  markDelete(id: string) {
    let lesson = this.focusedCells[0]?.lesson
    if (lesson == undefined) return

    this.journalService.deleteMark(id).subscribe({
      next: id => {
        lesson!!.marks = lesson!!.marks?.filter(value => value.id != id)
      }
    })
  }

  closeMarkPopup() {
    let focusedCell = this.focusedCells[this.focusedCells.length - 1]
    this.focusCell(focusedCell.x, focusedCell.y)

    this.focusedCells = []
  }

  hideMarkPopup() {
    let focusedCell = this.focusedCells[this.focusedCells.length - 1]
    this.focusCell(focusedCell.x, focusedCell.y)

    this.focusedCells = [focusedCell]
  }

  @HostListener('document:keydown', ['$event'])
  keyDown(event: KeyboardEvent) {
    if (event.key == 'Control') this.isCtrlPressed = true
    if (event.key == 'Shift') this.isShiftPressed = true
  }

  @HostListener('document:keyup', ['$event'])
  keyUp(event: KeyboardEvent) {
    if (event.key == 'Control') this.isCtrlPressed = false
    if (event.key == 'Shift') this.isShiftPressed = false
  }

  onDateClick(journal: Journal, date: Lesson) {
    this.focusedCells = []
    if (date.collapsedType != undefined) {
      this.collapseType = undefined

      this.journalService.groupDate(journal, date, date.collapsedType)
      return;
    }

    if (this.isCtrlPressed) {
      this.collapseType = undefined
      this.journalService.groupDate(journal, date, 'day')
      return
    }
    if (this.isShiftPressed) {
      this.collapseType = undefined
      this.journalService.groupDate(journal, date, 'month')
      return
    }

    this.selectedDate = (date == this.selectedDate) ? null : date
  }

  toggleCollapse(journal: Journal) {
    this.focusedCells = []
    this.journalService.expand(journal)

    switch (this.collapseType) {
      case undefined:
        this.collapseType = "day"
        break
      case "day":
        this.collapseType = "month"
        break
      case "month":
        this.collapseType = undefined
    }

    if (this.collapseType == undefined) return

    let lastDate: moment.Moment | undefined = undefined
    let lessons: Lesson[] = []
    journal.dates.forEach(value => {
      if ((lastDate != undefined && compareDates(lastDate, value.startDate, this.collapseType!!)) || value.collapsedType != undefined) return

      lastDate = value.startDate
      lessons.push(value)
    })

    lessons.forEach(l => {
      this.journalService.groupDate(journal, l, this.collapseType!!)
    })
  }

  filterCollapsed(lessons: Lesson[], dates = lessons): Lesson[] {
    return lessons.filter((_, i) => !dates[i].collapsed)
  }
}


interface Point {
  x: number
  y: number

  lesson: Lesson
  studentID: string
}
