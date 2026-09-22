import { Component, input } from '@angular/core';
import { ActivityPreview } from '../activity';

@Component({
  selector: 'app-search-preview',
  templateUrl: './search-preview.html',
  styleUrl: './search-preview.css',
})
export class SearchPreview {
  readonly preview = input.required<Extract<ActivityPreview, { kind: 'search' }>>();
}
