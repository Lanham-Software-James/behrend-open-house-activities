import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'activities/beat-binary-search',
    title: 'Beat Binary Search | Penn State Behrend',
    loadComponent: () => import('./activities/beat-binary-search/beat-binary-search').then((m) => m.BeatBinarySearch),
  },
  {
    path: 'activities/shortest-path',
    title: 'Find the Shortest Path | Penn State Behrend',
    loadComponent: () => import('./activities/shortest-path/shortest-path').then((m) => m.ShortestPath),
  },
  {
    path: 'activities/binary-challenge',
    title: 'Binary Challenge | Penn State Behrend',
    loadComponent: () => import('./activities/binary-challenge/binary-challenge').then((m) => m.BinaryChallenge),
  },
];
