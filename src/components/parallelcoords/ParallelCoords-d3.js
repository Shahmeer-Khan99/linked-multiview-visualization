import * as d3 from 'd3';

class ParallelCoordsD3 {
    margin = { top: 50, right: 20, bottom: 20, left: 20 };
    size;
    width;
    height;
    root;
    xScale;
    yScales = {};
    lineLayer;
    axisLayer;
    dimensions = [];
    defaultOpacity = 0.12;
    highlightedOpacity = 1;
    stroke = '#4682b4';

    constructor(el) { this.el = el; }

    create(config) {
        this.size = { width: config.size.width, height: config.size.height };
        this.width = this.size.width - this.margin.left - this.margin.right;
        this.height = this.size.height - this.margin.top - this.margin.bottom;

        d3.select(this.el).selectAll("*").remove();
        const svg = d3.select(this.el)
            .append("svg")
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom);

        this.root = svg.append("g")
            .attr("transform", `translate(${this.margin.left},${this.margin.top})`);

        this.lineLayer = this.root.append("g").attr("class", "lines");
        this.axisLayer = this.root.append("g").attr("class", "axes");

        this.xScale = d3.scalePoint().range([0, this.width]).padding(0.5);
    }

    setDimensions(dimensions) { this.dimensions = dimensions; this.xScale.domain(dimensions); }

    updateScales(data) {
        this.dimensions.forEach(dim => {
            const extent = d3.extent(data, d => +d[dim]);
            this.yScales[dim] = d3.scaleLinear().domain(extent).range([this.height,0]).nice();
        });
    }

    path(d) { return d3.line()(this.dimensions.map(p => [this.xScale(p), this.yScales[p](+d[p])])); }

    renderParallelCoords(data, dimensions, controllerMethods) {
        if (!data || !dimensions || dimensions.length===0) return;

        this.setDimensions(dimensions);
        this.updateScales(data);

        // axes
        const axes = this.axisLayer.selectAll('.axis').data(dimensions);
        axes.join(
            enter => {
                const g = enter.append('g')
                    .attr('class','axis')
                    .attr('transform', d => `translate(${this.xScale(d)},0)`);

                g.append('g')
                    .attr('class','yAxis')
                    .each((d,i,nodes) => d3.select(nodes[i]).call(d3.axisLeft(this.yScales[d]).ticks(4)));

                g.append('text')
                    .attr('y', -10)
                    .attr('text-anchor','middle')
                    .text(d => d)
                    .style('font-size',12);

                g.append('g')
                    .attr('class','axis-brush')
                    .each((dim,i,nodes) => {
                        const brush = d3.brushY()
                            .extent([[-10,0],[10,this.height]])
                            .on('brush end', (event) => this._axisBrushed(event, controllerMethods, data));
                        d3.select(nodes[i]).call(brush);
                    });

                return g;
            },
            update => update.attr('transform', d => `translate(${this.xScale(d)},0)`),
            exit => exit.remove()
        );

        // lines
        const lines = this.lineLayer.selectAll('path').data(data, d => d.index);
        lines.join(
            enter => enter.append('path')
                .attr('d', d => this.path(d))
                .attr('fill','none')
                .attr('stroke',this.stroke)
                .attr('stroke-width',1)
                .attr('opacity',this.defaultOpacity),
            update => update.transition().duration(350).attr('d', d => this.path(d)),
            exit => exit.remove()
        );
    }

    _axisBrushed(event, controllerMethods, data) {
        const selections = [];
        this.axisLayer.selectAll('.axis').nodes().forEach((node,i)=>{
            const dim = this.dimensions[i];
            const brushNode = d3.select(node).select('.axis-brush').node();
            const sel = d3.brushSelection(brushNode);
            if(sel) selections.push({dim, range:[this.yScales[dim].invert(sel[1]), this.yScales[dim].invert(sel[0])]});
        });

        const matched = selections.length===0 ? [] :
            data.filter(d => selections.every(s => d[s.dim]>=s.range[0] && d[s.dim]<=s.range[1]));

        controllerMethods?.updateSelectedItems(matched);
    }

    highlightSelectedItems(selectedItems) {
        const selectedSet = new Set((selectedItems||[]).map(d=>d.index));

        this.lineLayer.selectAll('path')
            .attr('stroke', d => selectedSet.has(d.index) ? 'orange' : this.stroke)
            .attr('stroke-width', d => selectedSet.has(d.index) ? 2 : 1)
            .attr('opacity', d => selectedSet.has(d.index) ? this.highlightedOpacity : this.defaultOpacity);
    }

    clear() { d3.select(this.el).selectAll('*').remove(); }
}

export default ParallelCoordsD3;
