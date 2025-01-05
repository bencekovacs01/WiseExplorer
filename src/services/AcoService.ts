export class Ant {
    public tour: number[];
    public distanceTraveled: number;

    constructor(startNode: number) {
        this.tour = [startNode];
        this.distanceTraveled = 0;
    }

    visitNode(node: number, distance: number) {
        this.tour.push(node);
        this.distanceTraveled += distance;
    }
}

interface ACOOptions {
    distanceMatrix: number[][];
    numAnts: number;
    alpha: number;
    beta: number;
    evaporationRate: number;
    iterations: number;
}

export default class ACO {
    private distanceMatrix: number[][];
    private numAnts: number;
    private alpha: number;
    private beta: number;
    private evaporationRate: number;
    private iterations: number;
    private pheromones: number[][];
    private ants: Ant[] = [];
    private inverseDistances: number[][];

    constructor(options: ACOOptions) {
        this.distanceMatrix = options.distanceMatrix;
        this.numAnts = options.numAnts;
        this.alpha = options.alpha;
        this.beta = options.beta;
        this.evaporationRate = options.evaporationRate;
        this.iterations = options.iterations;
        this.pheromones = this.initializePheromones();
        this.inverseDistances = this.computeInverseDistances();
    }

    initializePheromones(): number[][] {
        const n = this.distanceMatrix.length;
        return Array.from({ length: n }, () => Array(n).fill(1));
    }

    computeInverseDistances(): number[][] {
        return this.distanceMatrix.map((row) =>
            row.map((distance) => (distance === 0 ? 0 : 1 / distance)),
        );
    }

    calculateProbability(ant: Ant, currentNode: number): number[] {
        const probabilities = Array(this.distanceMatrix.length).fill(0);
        const pheromone = this.pheromones[currentNode];
        const distances = this.inverseDistances[currentNode];

        let denominator = 0;
        for (let i = 0; i < pheromone.length; i++) {
            if (!ant.tour.includes(i)) {
                denominator +=
                    Math.pow(pheromone[i], this.alpha) *
                    Math.pow(distances[i], this.beta);
            }
        }

        for (let i = 0; i < pheromone.length; i++) {
            if (!ant.tour.includes(i)) {
                const numerator =
                    Math.pow(pheromone[i], this.alpha) *
                    Math.pow(distances[i], this.beta);
                probabilities[i] = numerator / denominator;
            }
        }
        return probabilities;
    }

    chooseNextNode(probabilities: number[]): number {
        const random = Math.random();
        let cumulativeProbability = 0;

        for (let i = 0; i < probabilities.length; i++) {
            cumulativeProbability += probabilities[i];
            if (random <= cumulativeProbability) {
                return i;
            }
        }
        return -1;
    }

    updatePheromones() {
        const pheromoneMultiplier = 1.0 / this.numAnts;
        const n = this.distanceMatrix.length;

        this.pheromones = this.pheromones.map((row) =>
            row.map((pher) => pher * (1 - this.evaporationRate)),
        );

        this.ants.forEach((ant) => {
            const { tour, distanceTraveled } = ant;
            const pheromoneUpdate = pheromoneMultiplier / distanceTraveled;

            tour.slice(0, -1).forEach((from, index) => {
                const to = tour[index + 1];
                this.pheromones[from][to] += pheromoneUpdate;
                this.pheromones[to][from] += pheromoneUpdate;
            });
        });
    }

    async run(
        callback?: (
            iteration: number,
            bestTour: number[] | null,
            bestDistance: number,
            antsTours: number[][],
            pheromones?: number[][],
        ) => void,
    ): Promise<{ bestTour: number[] | null; bestDistance: number }> {
        let bestTour: number[] | null = null;
        let bestDistance = Infinity;

        for (let iter = 0; iter < this.iterations; iter++) {
            this.ants = [];

            for (let antIndex = 0; antIndex < this.numAnts; antIndex++) {
                const startNode = 0;
                const ant = new Ant(startNode);

                for (let i = 0; i < this.distanceMatrix.length - 1; i++) {
                    const currentNode = ant.tour[ant.tour.length - 1];
                    const probabilities = this.calculateProbability(
                        ant,
                        currentNode,
                    );
                    const nextNode = this.chooseNextNode(probabilities);
                    if (nextNode !== -1) {
                        ant.visitNode(
                            nextNode,
                            this.distanceMatrix[currentNode][nextNode],
                        );
                    }
                }
                ant.visitNode(
                    startNode,
                    this.distanceMatrix[ant.tour[ant.tour.length - 1]][
                        startNode
                    ],
                );
                this.ants.push(ant);
            }

            this.updatePheromones();

            const antsTours = this.ants.map((ant) => [...ant.tour]);

            this.ants.forEach((ant) => {
                if (ant.distanceTraveled < bestDistance) {
                    bestDistance = ant.distanceTraveled;
                    bestTour = [...ant.tour];
                }
            });

            if (callback) {
                callback(
                    iter,
                    bestTour,
                    bestDistance,
                    antsTours,
                    this.pheromones,
                );
            }

            // await new Promise((resolve) => setTimeout(resolve, 500));
        }

        return { bestTour, bestDistance };
    }

    getPheromones(): number[][] {
        return this.pheromones;
    }
}
