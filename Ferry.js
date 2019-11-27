
function fdisplayMap()
{
    // Display map after button is clicked
    document.getElementById( 'fmap' ).style.display = "block";

    finitialize();
}
function finitialize(){
    // Show checkboxes 
    document.getElementById('fcheckboxes').style.display = "block";
    d3.csv("merged_formatted_data.csv", function(error, data) {
        if (error) throw error;
        ferry = data.filter(function(d){
            if(d.ModeOfTransport == 'Ferry'){
                if(d.Year!= '2019')
                    return d;
            }       
        });

        var fmap = null;

// Group data according to name

        var tls = d3.nest()
        .key(function(d) {return d.Name})
        //.rollup(function(v) { return parseInt(d3.mean(v, function(d) {return parseFloat(d.NumberOfTrips.replace(/,/g, ''))}))})
        .entries(ferry);

        // console.log(tls);
        drawMapf(tls);

        function drawMapf(ferrydata){
            //Initialise map only once
            if(fmap == null){
                fmap = L.map('fmap').setView([-33.8458, 151.1723], 12);  
                fmapLink = '<a href="http://openstreetmap.org">OpenStreetMap</a>';
                L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; ' + fmapLink + ' Contributors',
                    maxZoom: 18,
                }).addTo(fmap);
                fmap.invalidateSize();}


            /* Initialize the SVG layer */
            //L.svg().addTo(map);  
            fmap._initPathRoot();

            /* We simply pick up the SVG from the map object */
            var svg = d3.select("#fmap").select("svg"),
                g = svg.append("g");

            // Read ferry data

            d3.json("Ferrylines.json", function(err,collection) {



                for( var i=0;i<collection.wharfs.length; i++){
                    marker = new L.marker([collection.wharfs[i].wharf.coordinates[0],collection.wharfs[i].wharf.coordinates[1]], {opacity: 0.7})
                        .bindPopup(collection.wharfs[i].wharf.label)
                        .addTo(fmap);
                    //console.log(collection.stations[i].station.coordinates[0]);
                }


                lines = collection.lines;
                //console.log(lines);
                for(line in lines) {       
                    thisline = lines[line];
                    linedata = ferrydata.filter(function(d, values) {
                        //console.log(thisline.line.name);
                        keyname = d.key;
                        if(keyname.valueOf() == thisline.line.name.valueOf()) {
                            return d.values;
                        }
                
                    })
                    linedatavals = linedata[0].values;
                    // console.log(linedatavals);
                    var sum =0; var mean = 0;
                    for(i =0; i< linedatavals.length ; i++){
                        //console.log(parseFloat((linedatavals[i].NumberOfTrips).replace(/,/g, '')));
                        sum += parseFloat((linedatavals[i].NumberOfTrips).replace(/,/g, ''));
                    }
                    //  console.log(thisline.line.name)

                    startlabel = null;
                    endlabel = null;
                    for(st in collection.wharfs){
                        if(collection.wharfs[st].wharf.coordinates[0] == thisline.line.startcord[0] && collection.wharfs[st].wharf.coordinates[1] == thisline.line.startcord[1])
                            startlabel = collection.wharfs[st].wharf.label;
                        if(collection.wharfs[st].wharf.coordinates[0] == thisline.line.endcord[0] && collection.wharfs[st].wharf.coordinates[1] == thisline.line.endcord[1])
                            endlabel = collection.wharfs[st].wharf.label;
                    }
                   // console.log(startlabel,endlabel);
                    //Aggregate data based on average of number of trips
                    groupedlinedatavals = d3.nest()
                        .key(function(d) { return d.Year; })
                        .rollup(function(v) { return parseInt(d3.mean(v, function(d) {return parseFloat(d.NumberOfTrips.replace(/,/g, ''))}))})
                        .entries(linedatavals)
                    
                    mean = parseInt(sum/linedatavals.length/2000, 10);
                    if(mean <=2) {
                        mean = 3;
                    }
                    console.log(mean);

                    var latlngs = Array();
                    //console.log(lines[line].line.startcord);
                    latlngs.push(new L.LatLng(thisline.line.startcord[0],thisline.line.startcord[1]));

                    
                    latlngs.push(new L.LatLng(thisline.line.endcord[0],thisline.line.endcord[1]));
                    // Create polyline for each line
                    var polyline = L.polyline(latlngs, {color: 'blue',weight:mean, 'label' : thisline.line.name, 'otherstuff':groupedlinedatavals, 'startlabel' : startlabel, 'endlabel':endlabel}).bindPopup(lines[line].line.name);
                    //Bind popup of bar chart to each polyline
                    polyline.on('popupopen', function(e) {
                        lined = e.target.options.otherstuff;            
                        myarr =  Object.entries(lined);
                        newarr =myarr.sort(function(x, y){
                            return d3.ascending(x[1].key, y[1].key);
                        })

                        newlined =[]
                        for(i=0;i<newarr.length;i++){
                            var obj = {}
                            obj['key'] = newarr[i][1].key;
                            obj['value'] = newarr[i][1].value;
                            newlined[i] = obj
                        }


                        var popup = e.popup;

                        var div = d3.create("div");
                        div.html("<h2>"+e.target.options.label+"</h2><h3>" + e.target.options.startlabel + " to " + e.target.options.endlabel +"</h3>");

                        var margin = {top: 30, right: 30, bottom: 30, left: 30},
                            width = 400 - margin.left - margin.right,
                            height = 200 - margin.top - margin.bottom;

                        // append the svg object 
                        var svg = div.append("svg")
                        .attr("width", width + margin.left + margin.right)
                        .attr("height", height + margin.top + margin.bottom)
                        .append("g")
                        .attr("transform",
                              "translate(" + margin.left + "," + margin.top + ")");
                        //Define X axis                        
                        var x = d3.scaleLinear()
                        .domain([0, d3.max(newlined, function (d) {
                            return d.value;
                        })])
                        .range([ 0, width ]);
                        svg.append("g")
                            .attr("transform", "translate(0," + height + ")")
                            .call(d3.axisBottom(x).ticks(5))


                        // Build Y scales and axis:
                        var y = d3.scaleBand()
                        .range([ height, 0 ])
                        .domain(newlined.map(function (d) {
                            //console.log(d.key);
                            return d.key;
                        }))
                        .padding(0.4);
                        svg.append("g")
                            .call(d3.axisLeft(y));

                        // Draw the bars on the chart
                        var bars = svg.selectAll(".bar")
                        .data(newlined)
                        .enter()
                        .append("rect")
                        .attr("class", "bar")
                        .attr("y", function (d) {
                            console.log(y(d.key));
                            return y(d.key);
                        })
                        .attr("height", y.bandwidth())
                        .attr("x", 0)
                        .attr("width", function (d) {
                            console.log(parseInt(x(d.value),10));
                            return x(d.value);
                        })
                        .attr("fill", "#dd4274")
                        .append("title")
                        .text(function(thisElement, index){
                            return "Number_Of_Trips : " + thisElement.value.toLocaleString();
                        });


                        popup.setContent(div.node());
                    })

                    polyline.addTo(fmap);
                }
            })
            
            // Handle onchange of checkbox
            d3.selectAll(".fmyCheckbox").on("change",update);
            // update();

            function update(){
                var choices = [];
                d3.selectAll(".fmyCheckbox").each(function(d){
                    cb = d3.select(this);
                    if(cb.property("checked")){
                        choices.push(cb.property("value"));
                    }})
                // console.log(choices)
                // Calcuate new filters on data based on checkboxes
                categories = [];
                if(choices.length > 0){
                    for(i=0;i<choices.length;i++){
                        if(choices[i].valueOf() =="adult"){
                            categories.push("Adult");
                            categories.push("Sgl Trip Ferry Adult");                        
                        }
                        if(choices[i].valueOf() == "student"){
                            categories.push("School Student")
                        }
                        if(choices[i].valueOf() == "senior"){
                            categories.push("Senior/Pensioner")
                        }
                        if(choices[i].valueOf() == "concession"){
                            categories.push("Concession")
                        }                
                    }

                    //Filter and redraw the map
                    newdata = ferry.filter(function(d){
                        if(categories.includes(d.Type)){
                            return d;
                        }     

                    });
                    //  console.log(newdata)
                } else {
                    newdata = ferry;     
                } 

                var latestdata = d3.nest()
                .key(function(d) {return d.Name})
                .entries(newdata)
                if(fmap!=null){
                    fmap.off();
                    fmap.remove();
                    fmap= null}
                drawMapf(latestdata)
            }                                
        }
    })
}
