import { Component, input } from '@angular/core';
import { ActivityPreview } from '../activity';

@Component({
  selector: 'app-graph-preview',
  templateUrl: './graph-preview.html',
  styleUrl: './graph-preview.css',
})
export class GraphPreview {
  readonly preview = input.required<Extract<ActivityPreview, { kind: 'graph' }>>();
}
