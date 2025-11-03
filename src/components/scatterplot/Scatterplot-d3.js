import * as d3 from 'd3';

class ScatterplotD3 {
    margin = { top: 100, right: 10, bottom: 50, left: 100 };
    size;
    width;
    height;
    matSvg;
    defaultOpacity = 0.3;
    transitionDuration = 1000;
    circleRadius = 3;
    xScale;
    yScale;

    constructor(el) {
        this.el = el;
    }

    create(config) {
        this.size = { width: config.size.width, height: config.size.height };
        this.width = this.size.width - this.margin.left - this.margin.right;
        this.height = this.size.height - this.margin.top - this.margin.bottom;

        d3.select(this.el).selectAll('*').remove(); // clear

        this.matSvg = d3
            .select(this.el)
            .append("svg")
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom)
            .append("g")
            .attr("transform", `translate(${this.margin.left},${this.margin.top})`);

        this.xScale = d3.scaleLinear().range([0, this.width]);
        this.yScale = d3.scaleLinear().range([this.height, 0]);

        this.matSvg.append("g").attr("class", "xAxisG").attr("transform", `translate(0,${this.height})`);
        this.matSvg.append("g").attr("class", "yAxisG");
    }

    updateAxis(data, xAttr, yAttr) {
        this.xScale.domain(d3.extent(data, d => d[xAttr]));
        this.yScale.domain(d3.extent(data, d => d[yAttr]));

        this.matSvg.select(".xAxisG").transition().duration(500).call(d3.axisBottom(this.xScale));
        this.matSvg.select(".yAxisG").transition().duration(500).call(d3.axisLeft(this.yScale));
    }

    updateMarkers(selection, xAttr, yAttr) {
        selection.transition().duration(this.transitionDuration)
            .attr("transform", d => `translate(${this.xScale(d[xAttr])},${this.yScale(d[yAttr])})`)
            .style("opacity", this.defaultOpacity);
    }

    renderScatterplot(data, xAttr, yAttr, controllerMethods) {
        if (!data || data.length === 0) return;

        this.updateAxis(data, xAttr, yAttr);

        // JOIN markers
        const points = this.matSvg.selectAll(".markerG").data(data, d => d.index);

        points.join(
            enter => {
                const g = enter.append("g")
                    .attr("class", "markerG")
                    .style("opacity", this.defaultOpacity)
                    .on("click", (event, d) => {
                        event.stopPropagation();
                        controllerMethods.updateSelectedItems([d]);
                    });

                g.append("circle")
                    .attr("class", "markerCircle")
                    .attr("r", this.circleRadius)
                    .attr("fill", "steelblue")
                    .attr("stroke", "red");

                this.updateMarkers(g, xAttr, yAttr);
            },
            update => this.updateMarkers(update, xAttr, yAttr),
            exit => exit.remove()
        );

        // 2D brush
        this.matSvg.selectAll(".brush").remove();
        const brush = d3.brush()
            .extent([[0,0],[this.width,this.height]])
            .on("end", (event) => {
                if (!event.selection) {
                    controllerMethods.updateSelectedItems([]);
                    return;
                }
                const [[x0,y0],[x1,y1]] = event.selection;
                const selected = data.filter(d => {
                    const x = this.xScale(d[xAttr]);
                    const y = this.yScale(d[yAttr]);
                    return x0 <= x && x <= x1 && y0 <= y && y <= y1;
                });
                controllerMethods.updateSelectedItems(selected);
            });

        this.matSvg.append("g").attr("class","brush").call(brush);
    }

    highlightSelectedItems(selectedItems) {
        const selectedSet = new Set((selectedItems || []).map(d => d.index));

        this.matSvg.selectAll(".markerG")
            .style("opacity", d => selectedSet.has(d.index) ? 1 : this.defaultOpacity)
            .select(".markerCircle")
            .attr("stroke-width", d => selectedSet.has(d.index) ? 2 : 0);
    }

    clear() {
        d3.select(this.el).selectAll("*").remove();
    }
}

export default ScatterplotD3;
