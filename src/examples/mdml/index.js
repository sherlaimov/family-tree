(function () {

  d3.familyTree = {
      rootGeneration: 0,
      roundedCorner: 6,
      svgCanvasMinimumWidth: 400,
      generationWidth: 300,
      normalNodeWidth: 240,
      normalNodeHeight: 45,
      gapBetweenParentChild: 350,
      gapBetweenSpouses: 70,
      margin: {
          top: 0,
          right: 20,
          bottom: 0,
          left: 20
      },
      treeData: {
          "personId": "1000001",
              "personFullName": "Father-0 (PMI)",
              "personGenderId": 1,
              "personLivingOrDiedId": 2,
              "personSelected": true,
              "personNickName": "(PMI Nickname)",
              "personSpouses": [{
              "personId": "1000002",
                  "personFullName": "Mother-0 (MP)",
                  "personGenderId": 0,
                  "personSelected": false
          }, {
              "personId": "1000052",
                  "personFullName": "Mother-01 (MP2)",
                  "personGenderId": 0,
                  "personSelected": false
          }

          ],
              "personChildren": [{
              "personId": "1000003",
                  "personFullName": "Father 1 (YMP)",
                  "personGenderId": 1,
                  "personSelected": false,
                  "personSpouses": [{
                  "personId": "1000004",
                      "personFullName": "Mother-1 (MY)",
                      "personGenderId": 0,
                      "personSelected": false
              }],
                  "personChildren": [{
                  "personId": "1000023",
                      "personFullName": "Father-2 (JMJ)",
                      "personGenderId": 1,
                      "personSelected": false,
                      "personNickName": "(JMJ Nickname)",
                      "personPictureFileName": "M1000002.jpg",
                      "personSpouses": [{
                      "personId": "1000024",
                          "personFullName": "Mother-2 (MAJ)",
                          "personGenderId": 0,
                          "personSelected": false,
                          "personPictureFileName": "M1000003.jpg"
                  }]
              }]
          }, {
              "personId": "1000700",
                  "personFullName": "Father-1 (PMP)",
                  "personGenderId": 1,
                  "personSelected": false,
                  "personSpouses": [{
                  "personId": "1000701",
                      "personFullName": "Mother-1 (CMP)",
                      "personGenderId": 0,
                      "personSelected": false
              }],
                  "personChildren": [{
                  "personId": "1000702",
                      "personFullName": "Father-2 (JJJ)",
                      "personGenderId": 1,
                      "personSelected": false,
                      "personSpouses": [{
                      "personId": "1000703",
                          "personFullName": "Mother-2 (MJJ)",
                          "personGenderId": 0,
                          "personSelected": false
                  }]
              }]
          }]
      },


      updateTree: function () {

          d3.select("svg").remove();

          var svgCanvasWidth = d3.familyTree.svgCanvasMinimumWidth + (6 * d3.familyTree.generationWidth) + d3.familyTree.margin.left + d3.familyTree.margin.right;
          var svgCanvasHeight = 1300 + d3.familyTree.margin.top + d3.familyTree.margin.bottom;

          var treeFamily = d3.layout.tree()
              .children(function (d) {
              return d.personChildren;
          })
              .separation(function () {
              return 1;
          })
          //.separation(function(a, b) {return a.parent === b.parent ? 1 : .5;})
          .size([svgCanvasHeight, svgCanvasWidth]);

          var svgTree = d3.select("#ft_svg_div")
              .append("svg:svg")
              .attr("width", svgCanvasWidth)
              .attr("height", svgCanvasHeight)
              .style("margin", "1em 0 1em " + (-d3.familyTree.margin.left) + "px");

          var g = svgTree.selectAll("g")
              .data([].concat(d3.familyTree.treeData ? {
              nodes: treeFamily.nodes(d3.familyTree.treeData)
          } : []))
              .enter()
              .append("svg:g").attr("transform", function (d) {
              return "translate(" + ( !! d.flipped * svgCanvasWidth + d3.familyTree.margin.left) + "," + (d3.familyTree.margin.top) + ")";
          });

          var link = g.append("svg:g").attr("class", "link").selectAll("path").data(function (d) {
              return treeFamily.links(d.nodes);
          }).enter().append("path").attr("class", d3.familyTree.linkType);

          var node = g.append("svg:g")
              .attr("class", "node")
              .selectAll("g")
              .data(function (d) {
              return d.nodes;
          }).enter();

          var generations = node.append("svg:g").attr("class", "generation")

          var persons = generations.selectAll(".persons")
              .data(function (d) {
              return [d];
          }).enter()
              .append("svg:g")
              .attr("class", "person")
              .on("click", clickedNode);

          persons.append("svg:rect")
              .attr("class", function (d) {
              return d.personSelected ? "selected" : "normal";
          });

          persons.append("svg:text").attr("dy", ".35em").text(function (d) {
              return d.personFullName;
          }).each(function (d) {
              d.width = Math.max(32, this.getComputedTextLength() + 12);
          }).attr("x", function (d) {
              return d.flipped ? 6 - d.width : 6;
          });

          persons.append("svg:text").attr("dy", "1.5em").text(function (d) {
              return d.personNickName;
          }).attr("x", function (d) {
              return d.flipped ? 6 - d.width : 6;
          });

          d3.familyTree.resetTree(svgTree);

          d3.familyTree.updateSpouses(svgTree);

      },


      resetTree: function (svgTree) {
          var node = svgTree.selectAll(".node .generation")
              .attr("transform", function (d, i) {
              console.log(d)
              d.spouseX = d.depth * d3.familyTree.gapBetweenParentChild;
              d.spouseY = d.x;
              return "translate(" + (d.depth * d3.familyTree.gapBetweenParentChild) + "," + (d.x) + ")";
          });

          node.select("rect").attr("ry", d3.familyTree.roundedCorner).attr("rx", d3.familyTree.roundedCorner)
              .attr("class", function (d) {
              return d.personSelected ? "selected" : "normal";
          })
              .attr("y", function (d) {
              return -10;
          })
              .attr("height", function (d) {
              return d3.familyTree.normalNodeHeight;
          })
              .attr("width", d3.familyTree.normalNodeWidth)
              .filter(function (d) {
              return d.flipped;
          })
              .attr("x", function (d) {
              return -d.width;
          });

          svgTree.selectAll(".link path").attr("class", d3.familyTree.linkType).attr("d", d3.svg.diagonal().source(function (d) {
              return {
                  y: d.source.depth * d3.familyTree.gapBetweenParentChild + (d.source.flipped ? -1 : +1) * d3.familyTree.normalNodeWidth,
                  x: d.source.x + 12.5
              };
          }).target(function (d) {
              return {
                  y: d.target.depth * d3.familyTree.gapBetweenParentChild,
                  x: d.target.x + 12.5
              };
          }).projection(function (d) {
              return [
              d.y, d.x];
          }));
      },


      linkType: function (d) {
          return d.target.personId.split(/\s+/).map(function (t) {
              return "to-" + t;
          }).concat(d.source.personId.split(/\s+/).map(function (t) {
              return "from-" + t;
          }));
      },


      updateSpouses: function (svgTree) {

          var node = svgTree.selectAll(".node g")
              .append("svg:g")
              .attr("transform", function (d, i) {
              if (i == d3.familyTree.rootGeneration) return "translate(" + (d.spouseX) + "," + (d3.familyTree.gapBetweenSpouses) + ")";
              else return "translate(" + 0 + "," + (d3.familyTree.gapBetweenSpouses) + ")";
          })
              .filter(function (d, i) {
              if ("personSpouses" in d) return d.personSpouses;
          });

          var spouses = node.selectAll(".spouse")
              .data(function (d) {
              return d.personSpouses;
          }).enter()
              .append("g")
              .on("click", clickedNode);

          spouses.append("svg:rect")
              .attr("class", function (d) {
              return d.personSelected ? "selected" : "normal";
          })
              .attr("ry", d3.familyTree.roundedCorner).attr("rx", d3.familyTree.roundedCorner)
              .attr("y", function (d, i) {
              return -10 + i * (5 + d3.familyTree.normalNodeHeight);
          })
              .attr("height", d3.familyTree.normalNodeHeight)
              .attr("width", d3.familyTree.normalNodeWidth)

          spouses.append("svg:text")
              .attr("x", function (d) {
              return d.flipped ? 6 - d.width : 6;
          })
              .attr("y", function (d, i) {
              return 10 + i * (5 + d3.familyTree.normalNodeHeight);
          })
              .text(function (d) {
              return d.personFullName;
          })
              .each(function (d) {
              d.width = Math.max(32, this.getComputedTextLength() + 12);
          });
      }
  }

  function clickedNode(d) {
      console.log(d)
      resetNodePersonSelected(d3.familyTree.treeData);
      setNodePersonSelected(d3.familyTree.treeData, d);
      d3.familyTree.updateTree();
  }

  function resetNodePersonSelected(obj) {
      if (obj.personSelected) {
          obj.personSelected = false;
          return;
      }
      if ("personChildren" in obj) {
          for (var i = 0; i < obj.personChildren.length; i++) {
              resetNodePersonSelected(obj.personChildren[i]);
          }
      }
      if ("personSpouses" in obj) {
          for (var i = 0; i < obj.personSpouses.length; i++) {
              resetNodePersonSelected(obj.personSpouses[i]);
          }
      }
  }

  function setNodePersonSelected(obj, d) {
      console.log(d)
      if (obj.personId === d.personId) {
          obj.personSelected = true;
          return;
      }
      if ("personChildren" in obj) {
          for (var i = 0; i < obj.personChildren.length; i++) {
              setNodePersonSelected(obj.personChildren[i], d);
          }
      }
      if ("personSpouses" in obj) {
          for (var i = 0; i < obj.personSpouses.length; i++) {
              setNodePersonSelected(obj.personSpouses[i], d);
          }
      }
  }

  d3.familyTree.updateTree();

})();