import React from 'react';
import { useMapContext } from '@/src/contexts/MapContext';

const InstructionsPanel = () => {
    const {
        instructions,
        instructionsVisible,
        setInstructionsVisible,
        handleInstructionClicked,
    } = useMapContext();

    return instructionsVisible ? (
        <div
            style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'white',
                zIndex: 100000,
                padding: '10px',
                borderRadius: '4px',
                boxShadow: '0 0 5px rgba(0,0,0,0.8)',
                height: 'calc(100vh / 2)',
                width: 'calc(100vw / 4)',
                overflow: 'scroll',
            }}
            onMouseDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
            }}
        >
            <button
                onClick={() => setInstructionsVisible(false)}
                style={{
                    position: 'absolute',
                    top: '5px',
                    right: '5px',
                    background: 'red',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '50px',
                    height: '50px',
                    cursor: 'pointer',
                    fontSize: 20,
                }}
            >
                X
            </button>

            {instructions.length > 0 ? (
                instructions.map(({ routeNumber, instructions }) => (
                    <div key={routeNumber}>
                        <div style={{ fontWeight: 'bold', fontSize: 20 }}>
                            Instructions
                        </div>
                        <ul>
                            {instructions.map(({ text, index }) => (
                                <li
                                    key={index}
                                    onClick={() =>
                                        handleInstructionClicked(index)
                                    }
                                    style={{ cursor: 'pointer' }}
                                >
                                    {`${index + 1}. ${text?.text}`}
                                </li>
                            ))}
                        </ul>
                    </div>
                ))
            ) : (
                <p>No routes found. Please adjust your waypoints.</p>
            )}
        </div>
    ) : (
        <button
            onClick={() => setInstructionsVisible(true)}
            style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'white',
                zIndex: 100000,
                padding: '10px',
                borderRadius: '4px',
                boxShadow: '0 0 5px rgba(0,0,0,0.8)',
                cursor: 'pointer',
            }}
        >
            Show instructions
        </button>
    );
};

export default InstructionsPanel;
