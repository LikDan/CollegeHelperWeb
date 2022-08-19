import {Injectable} from '@angular/core';
import {JournalHttpService} from "../http/journal-http.service";
import {Observable} from "rxjs";
import {Journal, JournalOption} from "../../models";

@Injectable({providedIn: 'root'})
export class JournalService {
  journal$: Observable<Journal>
  options$: Observable<JournalOption[]>

  constructor(private httpService: JournalHttpService) {

  }

  getJournal(group: string, subject: string, teacher: string): Observable<Journal> {
    this.journal$ = this.httpService.getJournal(group, subject, teacher)
    return this.journal$
  }

  getOptions(): Observable<JournalOption[]> {
    this.options$ = this.httpService.getOptions()
    return this.options$
  }
}
