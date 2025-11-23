import { Component, ElementRef, Input, OnDestroy, AfterViewInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-audio-wave',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="wave-container">
      <canvas #canvas></canvas>
    </div>
  `,
    styles: [`
    .wave-container {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    canvas {
      width: 100%;
      height: 100%;
    }
  `]
})
export class AudioWaveComponent implements AfterViewInit, OnDestroy {
    @Input() analyser: AnalyserNode | null = null;
    @Input() active: boolean = false;

    @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;
    private ctx!: CanvasRenderingContext2D;
    private animationFrameId: number | null = null;
    private dataArray: Uint8Array | null = null;

    ngAfterViewInit() {
        const canvas = this.canvasRef.nativeElement;
        this.ctx = canvas.getContext('2d')!;
        this.resizeCanvas();
        window.addEventListener('resize', this.resizeCanvas.bind(this));
        this.animate();
    }

    ngOnDestroy() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        window.removeEventListener('resize', this.resizeCanvas.bind(this));
    }

    private resizeCanvas() {
        const canvas = this.canvasRef.nativeElement;
        const parent = canvas.parentElement;
        if (parent) {
            canvas.width = parent.clientWidth;
            canvas.height = parent.clientHeight;
        }
    }

    private animate() {
        if (!this.ctx || !this.canvasRef) return;

        const canvas = this.canvasRef.nativeElement;
        const width = canvas.width;
        const height = canvas.height;
        const centerY = height / 2;

        this.ctx.clearRect(0, 0, width, height);

        if (this.active && this.analyser) {
            if (!this.dataArray || this.dataArray.length !== this.analyser.frequencyBinCount) {
                this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
            }
            this.analyser.getByteFrequencyData(this.dataArray);

            const barWidth = (width / this.dataArray.length) * 2.5;
            let barHeight;
            let x = 0;

            // Create gradient
            const gradient = this.ctx.createLinearGradient(0, 0, width, 0);
            gradient.addColorStop(0, '#a855f7'); // Purple
            gradient.addColorStop(0.5, '#ef4444'); // Red
            gradient.addColorStop(1, '#a855f7'); // Purple

            this.ctx.fillStyle = gradient;

            // Draw bars mirrored from center? Or just standard?
            // Let's do a mirrored look for symmetry, looks cooler.
            // Actually, standard spectrum is fine, but let's center it.
            // Let's just draw standard bars but centered vertically.

            // Filter out very low values to "only show when speak"
            const threshold = 10;

            for (let i = 0; i < this.dataArray.length; i++) {
                const value = this.dataArray[i];

                if (value > threshold) {
                    barHeight = (value / 255) * height; // Scale to height

                    // Draw centered vertically
                    this.ctx.fillRect(x, centerY - barHeight / 2, barWidth, barHeight);
                }

                x += barWidth + 1;
            }
        } else {
            // Flat line or nothing
            // this.ctx.beginPath();
            // this.ctx.strokeStyle = '#e5e7eb'; // Gray-200
            // this.ctx.lineWidth = 2;
            // this.ctx.moveTo(0, centerY);
            // this.ctx.lineTo(width, centerY);
            // this.ctx.stroke();
        }

        this.animationFrameId = requestAnimationFrame(this.animate.bind(this));
    }
}
