import { useEffect, useRef } from 'react';
import ParallelCoordsD3 from './ParallelCoords-d3';

function ParallelCoordsContainer({ data, dimensions, selectedItems, parallelControllerMethods }) {
    const divRef = useRef(null);
    const d3Ref = useRef(null);

    const getChartSize = () => {
        let width = 800, height = 400;
        if (divRef.current) {
            width = divRef.current.offsetWidth;
            height = divRef.current.offsetHeight - 4;
        }
        return { width, height };
    };

    // Create chart once
    useEffect(() => {
        const vis = new ParallelCoordsD3(divRef.current);
        vis.create({ size: getChartSize() });
        d3Ref.current = vis;
        return () => vis.clear();
    }, []);

    // Render whenever data/dimensions change
    useEffect(() => {
        if (data && data.length > 0 && d3Ref.current) {
            d3Ref.current.renderParallelCoords(data, dimensions, parallelControllerMethods);
        }
    }, [data, dimensions, parallelControllerMethods]);

    // Highlight updates
    useEffect(() => {
        if (d3Ref.current) {
            d3Ref.current.highlightSelectedItems(selectedItems);
        }
    }, [selectedItems]);

    return (
        <div
            ref={divRef}
            className="parallelcoordsDivContainer"
            style={{ width: '100%', height: '500px' }}
        />
    );
}

export default ParallelCoordsContainer;
