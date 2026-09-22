import { NgComponentOutlet } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Activity } from './activity';
import { GraphPreview } from './previews/graph-preview';
import { SearchPreview } from './previews/search-preview';
import { BinaryPreview } from './previews/binary-preview';

@Component({
  selector: 'app-home',
  imports: [RouterLink, NgComponentOutlet],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  // Array order controls card order. Themes style the preview; card bodies stay white.
  protected readonly activities: readonly Activity[] = [
    {
      id: 'path',
      previewComponent: GraphPreview,
      theme: 'light',
      route: '/activities/shortest-path',
      title: 'Find the Shortest Path',
      category: '01 / Graphs & networks',
      description: 'Every connection has a cost. Find your way from start to finish, then see how your route compares with Dijkstra’s algorithm.',
      concept: 'Explore the ideas behind maps and networks.',
      actionLabel: 'Explore challenge',
      preview: { kind: 'graph', label: 'MANY ROUTES. ONE SHORTEST PATH.', start: 'START', finish: 'FINISH' },
    },
    {
      id: 'search',
      previewComponent: SearchPreview,
      theme: 'dark',
      route: '/activities/beat-binary-search',
      title: 'Beat Binary Search',
      category: '02 / Algorithms',
      description: 'A number between 1 and 100. An algorithm that needs at most 7 guesses. How will you measure up?',
      concept: 'Discover the power of cutting a problem in half.',
      actionLabel: 'Explore challenge',
      preview: { kind: 'search', label: 'ONE NUMBER. A SMARTER SEARCH.', min: 1, max: 100, guess: 50, caption: 'Higher or lower?' },
    },
    {
      id: 'binary',
      previewComponent: BinaryPreview,
      theme: 'light',
      route: '/activities/binary-challenge',
      title: 'Binary Challenge',
      category: '03 / Binary numbers',
      description: 'Just zeros and ones. Flip the bits to build a target number and discover how computers represent information.',
      concept: 'Learn to speak a little computer.',
      actionLabel: 'Explore challenge',
      preview: {
        kind: 'binary', label: 'EIGHT BITS. ENDLESS POSSIBILITIES.',
        caption: 'A whole new way to make', total: 86,
        bits: [
          { weight: 128, value: 0 }, { weight: 64, value: 1 },
          { weight: 32, value: 0 }, { weight: 16, value: 1 },
          { weight: 8, value: 0 }, { weight: 4, value: 1 },
          { weight: 2, value: 1 }, { weight: 1, value: 0 },
        ],
      },
    },
  ];
}
