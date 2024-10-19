export const findMinimumDistanceRoute = async (pois: any[]) => {
    if (!pois || pois.length < 2) {
        throw new Error('Please provide at least 2 POIs.');
    }

    return [{
        from: pois[0],
        to: pois[1],
        distance: 10,
    }];
};