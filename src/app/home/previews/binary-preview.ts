import { Component, input } from '@angular/core';
import { ActivityPreview } from '../activity';

@Component({
  selector: 'app-binary-preview',
  templateUrl: './binary-preview.html',
  styleUrl: './binary-preview.css',
})
export class BinaryPreview {
  readonly preview = input.required<Extract<ActivityPreview, { kind: 'binary' }>>();
}
