import { app } from "/scripts/app.js";
import { ComfyWidgets } from '/scripts/widgets.js'

app.registerExtension({
    name: "diffus3.GlobalVariableNode",
    registerCustomNodes() {
        class GlobalVariableNode {
            defaultVisibility = true;
            serialize_widgets = true;

            constructor() {
                if (!this.properties) {
                    this.properties = {
                        "variableName": ""
                    };
                }
                this.properties.showOutputText = GlobalVariableNode.defaultVisibility;

                const node = this;

                this.addWidget(
                    "text",
                    "Name",
                    '',
                    (s, t, u, v, x) => {
                        node.validateName(node.graph);
                        this.update();
                        this.properties.variableName = this.widgets[0].value;
                    },
                    {}
                );

                this.addInput("*", "*");
                this.addOutput("*", "*");

                this.onConnectionsChange = function (
                    slotType,
                    slot,
                    isChangeConnect,
                    link_info,
                    output
                ) {
                    console.log("onConnectionsChange");
                    this.update();
                };

                this.validateName = function (graph) {
                    let widgetValue = node.widgets[0].value;

                    if (widgetValue !== '') {
                        let tries = 0;
                        let collisions = [];

                        do {
                            collisions = graph._nodes.filter((otherNode) => {
                                if (otherNode === this) {
                                    return false;
                                }
                                if (otherNode.type === 'diffus3.GlobalVariableNode' && otherNode.widgets[0].value === widgetValue) {
                                    return true;
                                }
                                return false;
                            });
                            if (collisions.length > 0) {
                                widgetValue = node.widgets[0].value + "_" + tries;
                            }
                            tries++;
                        } while (collisions.length > 0);
                        node.widgets[0].value = widgetValue;
                        this.update();
                    }
                };

                this.update = function () {
                    console.log("GlobalVariableNode.update()");
                    console.log(this.widgets[0].value);
                    if (node.graph) {
                        const value = this.getInputData(0);
                        if (value !== undefined) {
                            this.setGlobalVariable(this.properties.variableName, value);
                        }
                    }
                };

                this.setGlobalVariable = function (name, value) {
                    window[name] = value;
                };

                this.getGlobalVariable = function (name) {
                    return window[name];
                };

                // This node is purely frontend and does not impact the resulting prompt so should not be serialized
                this.isVirtualNode = true;
            }

            onRemoved() {
                console.log("onRemove");
                console.log(this);

                // Optionally remove the global variable on node removal
                // if (this.properties.variableName) {
                //     delete window[this.properties.variableName];
                // }
            }
        }

        LiteGraph.registerNodeType(
            "diffus3.GlobalVariableNode",
            Object.assign(GlobalVariableNode, {
                title: "Global Variable",
            })
        );

        GlobalVariableNode.category = "utils";
    },
});
