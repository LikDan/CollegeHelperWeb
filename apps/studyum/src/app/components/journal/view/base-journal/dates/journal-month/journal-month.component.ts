import {Component, Input} from "@angular/core"
import {Lesson} from "../../../../../../models/schedule"
import {JournalCollapseService} from "../../../../../../services/shared/journal/journal-collapse.service"

@Component({
  selector: "app-journal-month",
  templateUrl: "./journal-month.component.html",
  styleUrls: ["./journal-month.component.scss"]
})
export class JournalMonthComponent {
  @Input() month: Lesson[][]
  @Input() monthLessons: Lesson[][][]

  constructor(private service: JournalCollapseService) {
  }

  get collapsed(): boolean {
    return this.service.getLessonCollapseType(this.month[0][0]) === "month"
  }

  get collapseAmount(): number {
    return this.service.getCollapseAmount(this.month)
  }

  mapMonth(monthLesson: Lesson[][][], i: number): Lesson[][] {
    return monthLesson.map(l => l[i])
  }

  mapCollapse = (): Lesson[] => this.service.buildLessons(this.monthLessons.map(v => v.flat()))

  dateClick(): void {
    return this.service.click(this.month[0][0])
  }
}
