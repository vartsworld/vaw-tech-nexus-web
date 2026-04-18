/// <reference types="vite/client" />

declare const __APP_VERSION__: string;

declare module 'react-player' {
  import React from 'react';
  export default class ReactPlayer extends React.Component<any, any> {
    seekTo(amount: number, type?: 'seconds' | 'fraction'): void;
    getCurrentTime(): number;
    getDuration(): number;
    getInternalPlayer(key?: string): any;
  }
}
