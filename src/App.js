import './App.css';
import { useState, useEffect } from 'react';
import { fetchCSV } from "./utils/helper";
import ScatterplotContainer from "./components/scatterplot/ScatterplotContainer";
import ParallelCoordsContainer from "./components/parallelcoords/ParallelCoordsContainer";

function App() {
    const [data, setData] = useState([]);
    const [selectedItems, setSelectedItems] = useState([]);

    useEffect(() => {
        fetchCSV("data/Housing.csv", (response) => {
            const cleaned = response.data.map((d, i) => ({
                ...d,
                area: +d.area,
                price: +d.price,
                rooms: +d.bedrooms,
                stories: +d.stories,
                index: i
            }));
            setData(cleaned);
        });
    }, []);

    // shared selection logic
    const updateSelectedItems = (items) => {
        setSelectedItems(items); // just store original objects
    };

    const scatterplotControllerMethods = { updateSelectedItems, selectedItems };
    const parallelControllerMethods = { updateSelectedItems, selectedItems };

    return (
        <div className="App">
            <div id="MultiviewContainer" className="row">
                <ScatterplotContainer
                    scatterplotData={data}
                    xAttribute="area"
                    yAttribute="price"
                    selectedItems={selectedItems}
                    scatterplotControllerMethods={scatterplotControllerMethods}
                />
                <ParallelCoordsContainer
                    data={data}
                    dimensions={["price", "area", "rooms", "stories"]}
                    selectedItems={selectedItems}
                    parallelControllerMethods={parallelControllerMethods}
                />
            </div>
        </div>
    );
}

export default App;
