'use strict';

const chartInstances = {};

class AnalysisPlotter {
    constructor(container) {
        this.container = container;
    }

    plot(data) {
        if (chartInstances[this.container]) {
            chartInstances[this.container].destroy();
        }
        
        const ctx = document.getElementById(this.container).getContext('2d');
        
        const L1 = data.beam.primarySpan;
        const L2 = data.beam.secondarySpan || L1;
        const totalLength = L1 + L2;
        const numPoints = 100;
        const step = totalLength / numPoints;
        
        const points = [];
        for (let i = 0; i <= numPoints; i++) {
            const x = i * step;
            const pt = data.equation(x);
            points.push(pt);
        }
        
        chartInstances[this.container] = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [{
                    label: this.container.replace('_', ' ').toUpperCase(),
                    data: points,
                    borderColor: this.getColor(),
                    backgroundColor: this.getColor(),
                    borderWidth: 2,
                    pointRadius: 0,
                    fill: false,
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    x: {
                        type: 'linear',
                        title: {
                            display: true,
                            text: 'x (m)'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: this.getYAxisLabel()
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true
                    }
                }
            }
        });
    }
    
    getColor() {
        if (this.container.includes('deflection')) return 'blue';
        if (this.container.includes('shear')) return 'green';
        if (this.container.includes('bending')) return 'red';
        return 'black';
    }
    
    getYAxisLabel() {
        if (this.container.includes('deflection')) return 'Deflection (mm)';
        if (this.container.includes('shear')) return 'Shear Force (kN)';
        if (this.container.includes('bending')) return 'Bending Moment (kN-m)';
        return 'Value';
    }
}
