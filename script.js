// app.js

let dataset = [];
let centroids = [];
let clusters = [];
let k = 6;  // Default number of clusters
let method = 'random';  // Default initialization method
let isConverged = false;
let manualCentroidSelection = false;
let maxDistance = [];  // This will hold the maximum distance for each cluster for color scaling.

// Function to dynamically generate `k` distinct colors in HSL space
function generateClusterColors(k) {
    const colors = [];
    for (let i = 0; i < k; i++) {
        const hue = (i * 360 / k) % 360;  // Spread colors evenly across the hue spectrum
        const saturation = 100;  // Full saturation
        const lightness = 50;  // Medium lightness
        colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
    }
    return colors;
}

// Generate random dataset
function generateDataset(numPoints = 300) {
    dataset = [];
    for (let i = 0; i < numPoints; i++) {
        dataset.push({
            x: Math.random() * 20 - 10,
            y: Math.random() * 20 - 10
        });
    }
    maxDistance = [];  // Reset maxDistance for each cluster
    clusters = [];  // Clear previous clusters
}

// Function to calculate the maximum distance for color scaling per cluster
function calculateMaxDistances() {
    clusters.forEach((cluster, i) => {
        maxDistance[i] = 0;
        cluster.forEach(point => {
            let dist = distance(point, centroids[i]);
            if (dist > maxDistance[i]) {
                maxDistance[i] = dist;
            }
        });
    });
}

// Function to plot the dataset, centroids, and clusters
function plotData() {
    let traces = [];
    const clusterColors = generateClusterColors(k);  // Generate colors for `k` clusters

    // Plot dataset points in gray if no clusters exist yet
    if (clusters.length === 0) {
        traces.push({
            x: dataset.map(p => p.x),
            y: dataset.map(p => p.y),
            mode: 'markers',
            type: 'scatter',
            marker: { color: 'gray', size: 8 },
            name: 'Dataset Points'
        });
    } else {
        // Calculate max distance for each cluster if clusters exist
        if (centroids.length > 0 && maxDistance.length === 0) {
            calculateMaxDistances();
        }

        // Plot clusters with color scaling
        clusters.forEach((cluster, clusterIdx) => {
            cluster.forEach(point => {
                let nearestCentroidDist = distance(point, centroids[clusterIdx]);
                let intensity = Math.floor((nearestCentroidDist / maxDistance[clusterIdx]) * 255);  // Scale from light to dark

                // Assign color based on the cluster's color and distance-based intensity
                let color = `rgba(${clusterColors[clusterIdx]}, ${(255 - intensity) / 255})`;

                traces.push({
                    x: [point.x],
                    y: [point.y],
                    mode: 'markers',
                    type: 'scatter',
                    marker: { color: color, size: 8 },
                    name: `Cluster ${clusterIdx + 1}`
                });
            });
        });
    }

    // Add centroid points (shown as red 'X' marks)
    if (centroids.length > 0) {
        traces.push({
            x: centroids.map(c => c.x),
            y: centroids.map(c => c.y),
            mode: 'markers',
            type: 'scatter',
            marker: { color: 'red', size: 12, symbol: 'x' },
            name: 'Centroids'
        });
    }

    let layout = {
        title: isConverged ? 'KMeans has converged' : 'KMeans Clustering Animation',
        xaxis: { range: [-10, 10] },
        yaxis: { range: [-10, 10] },
        showlegend: false  // Hide legend
    };

    Plotly.newPlot('plot', traces, layout);

    // Manual centroid selection handling
    if (manualCentroidSelection) {
        document.getElementById('plot').on('plotly_click', function(data) {
            if (centroids.length < k) {
                centroids.push({ x: data.points[0].x, y: data.points[0].y });
                plotData();  // Update the plot with the newly added centroid
            }
            if (centroids.length === k) {
                manualCentroidSelection = false;  // Stop selection after all centroids are placed
                document.getElementById('plot').on('plotly_click', null);  // Remove the click handler
            }
        });
    }
}

// Initialize centroids based on the selected method
function initializeCentroids() {
    centroids = [];
    clusters = [];
    maxDistance = [];  // Reset the max distance array
    isConverged = false;

    if (method === 'random') {
        let selected = new Set();
        while (centroids.length < k) {
            let index = Math.floor(Math.random() * dataset.length);
            if (!selected.has(index)) {
                centroids.push(dataset[index]);
                selected.add(index);
            }
        }
    } else if (method === 'farthest_first') {
        centroids.push(dataset[Math.floor(Math.random() * dataset.length)]);
        while (centroids.length < k) {
            let farthestPoint = dataset.reduce((farthest, point) => {
                let distToNearest = Math.min(...centroids.map(c => distance(c, point)));
                if (!farthest || distToNearest > farthest.dist) {
                    return { point, dist: distToNearest };
                }
                return farthest;
            }, null).point;
            centroids.push(farthestPoint);
        }
    } else if (method === 'kmeans++') {
        centroids.push(dataset[Math.floor(Math.random() * dataset.length)]);  // First centroid is random
        while (centroids.length < k) {
            let distSq = dataset.map(p => Math.min(...centroids.map(c => distanceSquared(p, c))));
            let cumulativeDistSq = distSq.reduce((acc, d, i) => [...acc, d + (acc[i-1] || 0)], []);
            let r = Math.random() * cumulativeDistSq[cumulativeDistSq.length - 1];
            let nextCentroid = dataset[cumulativeDistSq.findIndex(d => d >= r)];
            centroids.push(nextCentroid);
        }
    } else if (method === 'manual') {
        manualCentroidSelection = true;
        alert('Click on the plot to select the centroids manually');
    }

    plotData();
}

// KMeans Step Function (Show clustering process step-by-step)
function stepKMeans() {
    if (isConverged || centroids.length !== k) return;
    clusters = Array(k).fill().map(() => []);

    dataset.forEach(point => {
        let closest = 0;
        let minDist = distance(point, centroids[0]);
        for (let i = 1; i < centroids.length; i++) {
            let dist = distance(point, centroids[i]);
            if (dist < minDist) {
                minDist = dist;
                closest = i;
            }
        }
        clusters[closest].push(point);
    });

    let newCentroids = centroids.map((centroid, i) => {
        if (clusters[i].length > 0) {
            return {
                x: avg(clusters[i].map(p => p.x)),
                y: avg(clusters[i].map(p => p.y))
            };
        }
        return centroid;
    });

    isConverged = centroids.every((centroid, i) => distance(centroid, newCentroids[i]) < 0.01);

    centroids = newCentroids;
    plotData();  // Update the plot after each step

    if (isConverged) {
        alert("KMeans has converged!");
    }
}

// Utility Functions
function distance(p1, p2) {
    return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
}

function distanceSquared(p1, p2) {
    return (p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2;
}

function avg(arr) {
    return arr.reduce((a, b) => a + b) / arr.length;
}

// Event listeners for buttons
document.getElementById('stepBtn').addEventListener('click', stepKMeans);
document.getElementById('convergeBtn').addEventListener('click', function () {
    for (let i = 0; i < 100; i++) {
        stepKMeans();
        if (isConverged) break;
    }
});
document.getElementById('generateBtn').addEventListener('click', function () {
    generateDataset();
    initializeCentroids();  // Ensure centroids are initialized after dataset generation
});
document.getElementById('resetBtn').addEventListener('click', function () {
    isConverged = false;
    initializeCentroids();
    plotData();
});

// Input listeners
document.getElementById('numClusters').addEventListener('input', function (e) {
    k = parseInt(e.target.value);
});
document.getElementById('initMethod').addEventListener('change', function (e) {
    method = e.target.value;
    if (method === 'manual') {
        centroids = [];
        plotData();  // Clear centroids and start selection
    }
});

// Initialize the dataset and plot
generateDataset();
initializeCentroids();
plotData();
