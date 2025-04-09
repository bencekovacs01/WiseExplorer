'use client';

import { redirect } from "next/navigation";

export default function Page() {
    const pois = [
        { latitude: 123.12, longitude: 456.34 },
        { latitude: 789.12, longitude: 12.34 },
    ];

    const greedyPois = [
        {
            latitude: 24.59888,
            longitude: 46.52346,
        },
        {
            latitude: 24.59242,
            longitude: 46.53456,
        },
        {
            latitude: 24.59236,
            longitude: 46.52909,
        },
    ];

    const backtrackingPois = {
        start: {
            latitude: 24.59898,
            longitude: 46.52346,
        },
        end: {
            latitude: 24.59242,
            longitude: 46.53456,
        },
        buffer: 250,
    };

    const handleClick = () => {
        fetch('http://localhost:8080/poi/find-route-greedy', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(greedyPois),
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error(
                        'Network response was not ok ' + response.statusText,
                    );
                }
                return response.json();
            })
            .then((data) => {
                console.log(data);
            })
            .catch((error) => {
                console.error('Error:', error);
            });
    };

    const handleBacktrackingClick = () => {
        fetch('http://localhost:8080/poi/find-route-bt', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(backtrackingPois),
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error(
                        'Network response was not ok ' + response.statusText,
                    );
                }
                return response.json();
            })
            .then((data) => {
                console.log(data);
            })
            .catch((error) => {
                console.error('Error:', error);
            });
    };

    const handlPoiStandardClick = () => {
        fetch('http://localhost:8080/poi/poi-standard', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(backtrackingPois),
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error(
                        'Network response was not ok ' + response.statusText,
                    );
                }
                return response.json();
            })
            .then((data) => {
                console.log(data);
            })
            .catch((error) => {
                console.error('Error:', error);
            });
    };

    return redirect('/en/map');

    return (
        <>
            <div className="flex flex-col items-center justify-center h-screen">
                <h1 className="text-4xl font-bold mb-4">NodeJs!</h1>

                <button
                    style={{
                        backgroundColor: 'wheat',
                        fontSize: '24px',
                        padding: '10px',
                        color: 'black',
                        borderRadius: '10px',
                    }}
                    onClick={() => handleClick()}
                >
                    Greedy
                </button>

                <button
                    style={{
                        backgroundColor: 'wheat',
                        fontSize: '24px',
                        padding: '10px',
                        color: 'black',
                        borderRadius: '10px',
                        marginTop: '15px',
                    }}
                    onClick={() => handleBacktrackingClick()}
                >
                    Backtracking
                </button>

                <button
                    style={{
                        backgroundColor: 'wheat',
                        fontSize: '24px',
                        padding: '10px',
                        color: 'black',
                        borderRadius: '10px',
                        marginTop: '15px',
                    }}
                    onClick={() => handlPoiStandardClick()}
                >
                    POI Standard
                </button>
            </div>
        </>
    );
}
