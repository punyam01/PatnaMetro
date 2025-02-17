import mongoose from "mongoose";



//  Function to build adjacencylist for dfs ......................................................................//

const buildAdjacencyList = async () => {

    
        try {
            // Adjust the collection name as necessary (e.g., "Station" or "stations")
    const stations = await mongoose.connection.db.collection("Station").find().toArray();
    
    console.log("Raw Stations Data:", stations); // Debug: log the raw station objects

    // If no stations are returned, then either your collection name is wrong or the collection is empty.
    if (!stations || stations.length === 0) {
      console.error("No stations found in the collection.");
      return {};
    }

    const adjacencyList = {};
    const stationIndex = {};

    // Build a lookup for quick access to a station's full data.
    stations.forEach((station) => {
      stationIndex[station.name] = station;
    });

    // Process each station to build the adjacency list.
    stations.forEach((station) => {
      // Ensure the station exists in the adjacency list.
      if (!adjacencyList[station.name]) {
        adjacencyList[station.name] = [];
      }

      // Process each connection of this station.
      if (Array.isArray(station.connections)) {
        station.connections.forEach((connection) => {
          // Determine the line for the connection.
          let connectionLine = connection.line;
          if (connectionLine === undefined && stationIndex[connection.station]) {
            connectionLine = stationIndex[connection.station].line;
          }
          if (connectionLine === undefined) {
            connectionLine = station.line;
          }

          // Determine the junction flag for the connection.
          let connectionJunction = connection.isJunction;
          if (connectionJunction === undefined && stationIndex[connection.station]) {
            connectionJunction = stationIndex[connection.station].junction;
          }
          if (connectionJunction === undefined) {
            connectionJunction = station.junction;
          }

          // Add the forward connection if not already added.
          if (
            !adjacencyList[station.name].some(
              (conn) => conn.station === connection.station
            )
          ) {
            adjacencyList[station.name].push({
              station: connection.station,
              time: connection.time,
              line: connectionLine,
              isJunction: connectionJunction,
            });
          }

          // Add the reverse connection (to ensure bidirectionality).
          if (!adjacencyList[connection.station]) {
            adjacencyList[connection.station] = [];
          }
          if (
            !adjacencyList[connection.station].some(
              (conn) => conn.station === station.name
            )
          ) {
            adjacencyList[connection.station].push({
              station: station.name,
              time: connection.time,
              line: station.line,
              isJunction: station.junction,
            });
          }
        });
      } else {
        console.warn(`Station "${station.name}" does not have a valid connections array.`);
      }
    });

    
    return adjacencyList;
      
        } catch (error) {
          console.error("❌ Error building adjacency list:", error);
          throw new Error("Failed to build adjacency list");
        }
      };
      
    

    

    //  function to find the route bw two station ..........................................................................//

    const findMetroRoute = async (startStation, endStation) => {
        try {
            const adjacencyList = await buildAdjacencyList();
            const path = [];
            const visited = new Set();
            console.log(adjacencyList);
            const findPath = (current, destination, currentPath = []) => {
                visited.add(current);
                currentPath.push(current);

                if (current === destination) {
                    path.push([...currentPath]);
                    return true;
                }

                const neighbors = adjacencyList[current] || [];
                for (const neighbor of neighbors) {
                    if (!visited.has(neighbor.station)) {
                        if (findPath(neighbor.station, destination, currentPath)) {
                            return true;
                        }
                    }
                }

                currentPath.pop();
                visited.delete(current);
                return false;
            };

            findPath(startStation, endStation);

            if (path.length === 0) {
                return {
                    success: false,
                    message: "No route found"
                };
            }

            // Single array with all necessary information
            const route = path[0].map((stationName, index) => {
                const stationInfo = adjacencyList[stationName][0];
                const prevStationInfo = index > 0 ? adjacencyList[path[0][index - 1]][0] : null;

                return {
                    name: stationName,
                    line: stationInfo.line,
                    changeTrain: prevStationInfo && prevStationInfo.line !== stationInfo.line,
                    isFirst: index === 0,
                    isLast: index === path[0].length - 1
                };
            });

            return {
                success: true,
                route: route
            };

        } catch (error) {
            console.error('Error finding route:', error);
            return {
                success: false,
                error: 'Failed to find route'
            };
        }
    };

    //   routecontroller function for apiendpoint ...................................................//

    export const routeController = async (req, res) => {
        let { startStation, endStation } = req.query;

        startStation = startStation?.replace(/^"|"$/g, '').trim();
        endStation = endStation?.replace(/^"|"$/g, '').trim();
        
        if (!startStation || !endStation) {
            return res.status(400).json({
                success: false,
                error: 'Start and end stations are required'
            });
        }

        const routeResult = await findMetroRoute(startStation, endStation);

        if (!routeResult) {
            return res.status(404).json({
                success: false,
                error: 'No route found between the specified stations'
            });
        }

        res.json(routeResult);
    }