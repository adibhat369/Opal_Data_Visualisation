
window.onload = function(){


    // Read the data from the csv file
    d3.csv("merged_formatted_data.csv", function(error, data) {
        if (error) throw error;
        train = data.filter(function(d){
            if(d.ModeOfTransport == 'Train'){
                return d
            }
        });
        tram = data.filter(function(d){
            if(d.ModeOfTransport == 'Tram'){
                return d
            }
        });
        ferry = data.filter(function(d){
            if(d.ModeOfTransport == 'Ferry'){
                return d
            }
        });
        bus = data.filter(function(d){
            if(d.ModeOfTransport == 'Bus'){
                return d
            }
        });
        // Draw donut chart followed by heat map
        drawdonut();
        drawheatmap();



        function drawheatmap(){
            // set the dimensions and margins of the graph
            var margin = {top: 50, right: 50, bottom: 50, left: 50},
                width = 500 - margin.left - margin.right,
                height = 500 - margin.top - margin.bottom;
            // Append svg to div
            var svgd = d3.select("#heatmap")
            .append("svg")
            .attr("width", 800 + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform",
                  "translate(" + margin.left + "," + margin.top + ")");


            // Labels of row and columns
            var myGroups = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
            var myVars = ["TRAIN", "TRAM", "BUS", "FERRY"]

            // Build X scales and axis:
            var x = d3.scaleBand()
            .range([ 0, width ])
            .domain(myGroups)
            .padding(0.01);
            svgd.append("g")
                .attr("transform", "translate(0," + height + ")")
                .call(d3.axisBottom(x))


            // Build X scales and axis:
            var y = d3.scaleBand()
            .range([ height, 0 ])
            .domain(myVars)
            .padding(0.01);
            svgd.append("g")
                .call(d3.axisLeft(y));


            // Build color scale
            var myColor = d3.scaleLinear()
            .range(["#27BF00", "#E51A00"])
            .domain([0,100]);

            function dictcreator(result) {
                // Returns an aggregated value for each mode of transport
                var dict = {};

                for(row in result) {

                    if((result[row].Month in dict)){
                        dict[result[row].Month] += parseFloat(result[row].NumberOfTrips.replace(/,/g, ''))
                        // dict[result[row].Month] += parseInt(parseFloat(result[row].NumberOfTrips.replace(/,/g, ''))/factor,10);  

                    }

                    else {
                        dict[result[row].Month] = parseFloat(result[row].NumberOfTrips.replace(/,/g, ''))
                        //  dict[result[row].Month] = parseInt(parseFloat(result[row].NumberOfTrips.replace(/,/g, ''))/factor,10);
                    }
                }
                return dict
            }

            traindict = dictcreator(train);
            busdict = dictcreator(bus);
            tramdict = dictcreator(tram);
            ferrydict = dictcreator(ferry);

            dictobjects = {'TRAIN':traindict, 'BUS': busdict, 'TRAM' : tramdict, 'FERRY' : ferrydict};

            for(dict in dictobjects) {
                //console.log(dict);

                for(key in dictobjects[dict]){
                    // console.log(dictobjects[dict][key])

                    svgd.append("rect")
                        .attr("x", x(key))
                        .attr("y", function(d) { return y(dict)})
                        .attr("width", x.bandwidth() )
                        .attr("height", y.bandwidth() )
                        .style("fill", function(d) { 
                        if(dict == 'TRAIN' || dict == 'BUS'){
                            // console.log(parseInt(dictobjects[dict][key]/1000000,10));
                            return myColor(parseInt(dictobjects[dict][key]/1000000,10)) }
                        else{
                            // console.log(parseInt(dictobjects[dict][key]/150000,10));
                            return myColor(parseInt(dictobjects[dict][key]/150000,10)) }
                    })
                        .append("title")
                        .text(function(thisElement, index){
                        return "Mode:  " + dict +"\n"+ "Month:  " + key +"\n"+ "No_of_Trips:  " + dictobjects[dict][key].toLocaleString();
                    });

                }}
            // Append legend to heat map
            svgd.append("g")
                .attr("class", "legendLinear")
                .attr("transform", function(d,i){
                return "translate("+ (width  + 20) + "," + (i * 15 + 20) + ")"});

            var legendLinear = d3.legendColor()
            .shapeWidth(80)
            .orient('horizontal')
            .scale(myColor)
            .labels(["<25,000k","25-50,000k","50-75,000k","75-100,000k",">100,000k"])


            svgd.select(".legendLinear")
                .call(legendLinear);


        }
        //DONUT CHART
        function drawdonut(){
            var svg = d3.select("#donutchart")
            .append("svg")
            .attr("width", 650)
            .attr("height", 500)

            var div = d3.select("#donutchart").append("div").attr("class", "toolTip");
            //.append("g")
            // var svg = d3.select("#donutchart").append("svg")
            width = +svg.attr("width"),
                height = +svg.attr("height"),
                radius = Math.min(width, height) / 2,
                g = svg.append("g").attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

            // Color scale
            var color = d3.scaleOrdinal(["#7b6888", "#69b3a2", "#dd4274", "#ff8c00"]);

            // Draw pie
            var pie = d3.pie()
            .sort(null)
            .startAngle(1.1*Math.PI)
            .endAngle(3.1*Math.PI)
            .value(function(d) {return d.value });

            //Define radius of inner and outer circles of donut
            var path = d3.arc()
            .outerRadius(radius - 10)
            .innerRadius(radius - 70);

            var label = d3.arc()
            .outerRadius(radius - 40)
            .innerRadius(radius - 40);

            //Aggregate the data according to key value pair
            datanew = d3.nest()
                .key(function(d) { return d.ModeOfTransport; })
                .rollup(function(v) { return parseInt(d3.sum(v, function(d) {return parseFloat(d.NumberOfTrips.replace(/,/g, ''))}))})
                .entries(data);
            console.log(datanew);


            var arc = g.selectAll(".arc")
            .data(pie(datanew))
            .enter().append("g")
            .attr("class", "arc");

            // Draw the actual arcs
            arc.append("path")

                .style("fill", function(d) { return color(d.data.key); })
                .transition().delay(function(d,i) {
                return i * 500; }).duration(500)
                .attrTween('d', function(d) {
                var i = d3.interpolate(d.startAngle+0.1, d.endAngle);
                return function(t) {
                    d.endAngle = i(t); 
                    return path(d)
                }
            })

            // Append text to the centre of every arc
            arc.append("text")
                .attr("transform", function(d) { return "translate(" + label.centroid(d) + ")"; })
                .attr("dy", "1em")
                .attr("fill", "white")
                .transition()
                .delay(1000)
                .text(function(d) { return d.data.key; })
            ;

            // On hover action event
            d3.selectAll("path").on("mousemove", function(d) {
                div.style("left", d3.event.pageX+10+"px");
                div.style("top", d3.event.pageY-25+"px");
                div.style("display", "inline-block");
                div.html((d.data.key)+"<br>"+"Total trips : " +(d.value).toLocaleString() );
            });

            d3.selectAll("path").on("mouseout", function(d){
                div.style("display", "none");
            });

            //Append legend
            var legendG = svg.selectAll(".legend") 
            .data(pie(datanew))
            .enter().append("g")
            .attr("transform", function(d,i){
                return "translate(" + (width - 110) + "," + (i * 15 + 20) + ")"; // place each legend on the right and bump each one down 15 pixels
            })
            .attr("class", "legend");   

            legendG.append("rect") // make a matching color rect
                .attr("width", 10)
                .attr("height", 10)
                .attr("fill", function(d, i) {
                return color(d.data.key);
            });

            legendG.append("text") // add the text
                .text(function(d){
                return d.data.key;
            })
                .style("font-size", 15)
                .attr("y", 10)
                .attr("x", 15);

        }
    });
}


