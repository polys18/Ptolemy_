

The AI revolution is also a capital intensive one that requires to find the next best available land to put the next data center. The objective of the dashboard is to identify the best sites for data center development. To do so I leverage public data to define certain criteria to identify the best sites for development. Gauging from public information, I found that the best sites for development are ones that have low land cost, high proximity to established fiber lines, roads, substations and transmission lines. An exhaustive list of the criteria is found in Table X. While identifying the best lands, it is also important to gauge which sites are not eligible for any land development. Criteria used are sites that are included in or have a close proximity to military sites, airport runways, mines, federally, state and local protected areas and others. 

The final output of this project is a dashboard where one can visualize a heatmap identifying the most attractive areas. The user can also toggle through multiple criteria to get a very good approximation of the vicinity of each parcel.

## Methodology

This map is focused primarily in California and Texas with an aim of producing a raster where every cell is 500m x 500m to identify parcels that could be a fit for a data center. 

## Building the screens

The screens are essentially meant to identify areas where constructing a data center is not feasible. Table 1 below outlines how I identified the areas in which I applied these screening layers. For example in the first row I eliminated all sites which had a 1,000 meter buffer around a given military site, however inclusive for protected areas I also eliminated sites which are included inside the respective shapefiles. 

The way that I applied the screens is that I first rasterized the polygons from each of these layers into a 500mx500m cell size and assigned a value of 1 in areas that fell out of these and 0 if otherwise. To complete the layer I simply multiplied all the rasters together to create a single screening raster for all California and Texas.


## Building the Criteria

# Infrastructure-Related Criteria

Data Centers need good proximity to roads and fiber for construction to minimize construction costs. While data centers can build their own roads for access to sites, it is told that by minimizing proximity to a given would reduce construction costs. In addition, the farthest away from a transmission line the less they would be charged from a utility for actually building that transmission.

# Co-locating with Gas: 

Connecting data centers to electricity is a rather time consuming and costly process. Utilities often make data centers wait years until they can interconnect thus forming the largest bottleneck of the process. Data centers are now incentivized to bring their own generation to the and they usually contract with gas as it provides continuous and reliable generation. I thus decided to include criteria that enable data centers to find sites that would make building a gas plant an ideal location. Thus these criteria involve proximity to a nearby gas pipeline to reduce costs to interconnection as well as existing gas storage reservoirs. 

To meet their sustainability goals, data centers may also opt in to capture and store the carbon emissions from their generation. Thus I decided to also include proximity to areas where storing carbon becomes feasible. These are areas where the underground salinity levels exceed 10,000 ppm as part of the Clean Water Act, where developers can safely inject stored carbon. 

# Urban Areas

Data centers also care about latency and the farthest they are from an urban center the lower the time they can get to customers. This data gathered from the U.S. Census Bureau include areas where the number of households exceed 5,000.

Data Center Employees: An average data center would require from a 8-100 full time staff depending on the size of the facility. Staffing each data would prove significantly easier if the local county has the number of employees to support it. With this I leverage the data from the U.S. County Business Patterns from 2023 to count the number of employees located in each county. 


## Main insights

One can see that Texas has significantly more buildable area than California. This is because Texas has very few federal and environmentally protected areas that would initially block land size. In addition, Texas has significantly better buildable flat terrain than California which is the hsot of the Sierra mountains and yosemite making land siting incapable. 

In addition, one can also see that Texas has a lot darker areas indicating sizeable plots to build than California. It is no doubt that large hyperscales like OpenAI, Meta actively chose the lone star state for some of the largest mega projects like the 1.2 GW Stargate project which takes up as much electricity as almost 1 million homes. Texas’ has more urban areas and even span more in size. The U.S. Census dataset identifies X urban areas in Texas in comparison to Y areas in California.  In contrast, California is distinguished by X amount of urban size with an average land mass of X. 

Secondly, When it comes to transmission infrastructure, Texas has more transmission lines, more fiber lines and more substations than California. I observe that from recent energy trends where Texas built 15GW more power in the past year, whereas California struggled. New energy construction has highly preferred Texas because the state has had a proactive approach to transmission planning as in 2005 it built out all the transmission thus making it significantly faster to connect large scale data centers as well as new power plants to meet new electricity demand. 

## Limitations

While I think this tool is a great step in the right direction of identifying the right sites for data centers, there are a number of data that I have not yet incorporated which make it mission critical for identifying the right data. At this moment, I can identify the following. 

Parcel level data: To properly identify the right parcels one needs to know the if a parcel of land is available for purchase. That data while it exists is extremely expensive and would cost tens of thousands of dollars for purchase. 
