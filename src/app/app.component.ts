import { Component, Inject, ViewEncapsulation } from "@angular/core";
import { DOCUMENT } from "@angular/common";
import { demoData, Employee, DropInfo } from "../data";
import { debounce } from "@agentepsilon/decko";


@Component({
    selector: "my-app",
    templateUrl: "./app.component.html",
    styleUrls: ["./app.component.css"],
    encapsulation: ViewEncapsulation.None
})
export class AppComponent {
    
    nodes: Employee[] = demoData;

    // ids for connected drop lists
    dropTargetIds = [];
    nodeLookup = {};
    dropActionTodo: DropInfo = null;

    // For Undo
    parentIdUndo: number;
    targetItemUndo: [];
    childItemUndo: [];

    // For Redo
    nodesRedo: Employee[];
    nodesRedo1: Employee[];

    undoCount: number = 0;
    redoCount: number = 0;
    orderUndo: number;

    targetIdRedo: number;
    targetRedoIndex: number;

    disableUndo: boolean = true;
    disableRedo: boolean = true;


    constructor(
        @Inject(DOCUMENT) private document: Document
    ) 
    {
        this.prepareDragDrop(this.nodes);
    }

    prepareDragDrop(nodes: Employee[]) {
        nodes.forEach(node => {
            this.dropTargetIds.push(node.id.toString());
            this.nodeLookup[node.id] = node;
            this.prepareDragDrop(node.subordinates);
        });
    }

    @debounce(50)
    drag(event: { pointerPosition: { x: number; y: number; }; }) {
        let e = this.document.elementFromPoint(event.pointerPosition.x,event.pointerPosition.y);
        
        if (!e) {
            this.clearDragInfo();
            return;
        }
        let container = e.classList.contains("node-item") ? e : e.closest(".node-item");
        if (!container) {
            this.clearDragInfo();
            return;
        }
        this.dropActionTodo = {
            targetId: Number(container.getAttribute("data-id"))
        };
        const targetRect = container.getBoundingClientRect();
        const oneThird = targetRect.height / 3;

        if (event.pointerPosition.y - targetRect.top < oneThird) {
            // before
            this.dropActionTodo["action"] = "before";
        } else if (event.pointerPosition.y - targetRect.top > 2 * oneThird) {
            // after
            this.dropActionTodo["action"] = "after";
        } else {
            // inside
            this.dropActionTodo["action"] = "inside";
        }
        
        this.showDragInfo();
    }

    //main function
    move(event: { item: { data: any; }; previousContainer: { id: any; }; }) {
        if (!this.dropActionTodo) return;

        this.disableUndo = false;

        const draggedItemId = event.item.data;
        const parentItemId = event.previousContainer.id;
        this.parentIdUndo = parentItemId;

        const targetListId = this.getParentNodeId(this.dropActionTodo.targetId, this.nodes, 0);
        const targetId = this.dropActionTodo.targetId; 
        const draggedItem = this.nodeLookup[draggedItemId];
        this.targetItemUndo = draggedItem;
        const oldItemContainer = parentItemId != 0 ? this.nodeLookup[parentItemId].subordinates : this.nodes;
        const newContainer = targetListId != 0 ? this.nodeLookup[targetListId].subordinates : this.nodes;

        let i = oldItemContainer.findIndex(c => c.id === draggedItemId);
        this.orderUndo = i;
        oldItemContainer.splice(i, 1);

        switch (this.dropActionTodo.action) {
            case 'before':
            case 'after':
                this.targetIdRedo = targetListId;
                const targetIndex = newContainer.findIndex(c => c.id === this.dropActionTodo.targetId);
                this.targetRedoIndex = targetIndex;
                if(parentItemId !== targetListId) {
                    console.log('allow');
                    this.transferChildren(draggedItem, oldItemContainer, i);
                }
                if (this.dropActionTodo.action == 'before') {
                    newContainer.splice(targetIndex, 0, draggedItem);
                } else {
                    newContainer.splice(targetIndex + 1, 0, draggedItem);
                }
                break;

            case 'inside':
                this.targetIdRedo = targetId;
                this.targetRedoIndex = null;
                if(parentItemId !== targetListId && parentItemId !== targetId) {
                    console.log('allow');
                    this.transferChildren(draggedItem, oldItemContainer, i);
                }
                if(parentItemId === targetListId && parentItemId !== targetId) {
                    console.log('allow');
                    this.transferChildren(draggedItem, oldItemContainer, i);
                }
                this.nodeLookup[this.dropActionTodo.targetId].subordinates.push(draggedItem)
                break;
        }

        this.nodesRedo = this.nodes;

        this.redoCount = 1;
        this.undoCount = 1;
        this.clearDragInfo(true)
    }
    redo() {
        if(this.redoCount === 0) {
            alert('redo')
            return;
        };
        this.redoCount --;
        this.disableRedo = true;
        this.disableUndo = true;
        this.removeTarget(this.nodes, this.targetItemUndo);
        this.addTargetRedo(this.nodes, this.targetItemUndo, this.targetIdRedo, this.targetRedoIndex);
        this.addChildrenRedo(this.nodes, this.parentIdUndo, this.childItemUndo, this.orderUndo)

    }
    undo() {
        if(this.undoCount === 0) {
            alert('undo');
            return;
        }
        this.undoCount --;
        this.disableRedo = false;
        this.disableUndo = true;
        this.removeTarget(this.nodes, this.targetItemUndo);
        this.removeChild(this.nodes, this.childItemUndo);
        this.addTarget(this.nodes, this.targetItemUndo, this.childItemUndo, this.parentIdUndo, this.orderUndo);
        
    }

    // detail function
    removeTarget(nodes: any[], target) {
        for(let i = 0; i < nodes.length; i ++) {
            if(nodes[i].subordinates.length > 0) {
                this.removeTarget(nodes[i].subordinates, target);
            }
            if(nodes[i].id == target.id) {
                nodes.splice(i, 1);
                break;
            }
        }
    }
    removeChild(nodes: any[], child: any[]) {
        child.forEach(element => {
            for(let j = 0; j < nodes.length; j ++) {
                if(nodes[j].subordinates.length > 0) {
                    this.removeChild(nodes[j].subordinates, child)
                } 
                if(nodes[j].id == element.id) {
                    nodes.splice(j, 1);
                }
            }
        });
    }
    addTarget(nodes: Employee[], target, child: any[], parentId: number, order: number) {
        child.reverse().forEach(element => {
            target.subordinates.push(element);
        });
   
        this.add(nodes, target, parentId, order);
    }
    add(nodes: string | any[], targetList: any, parentId: number, order: number) {
        for(var i = 0; i < nodes.length; i ++) {
            if(nodes[i].subordinates.length > 0) {
                this.add(nodes[i].subordinates, targetList, parentId, order)
            }
            if(nodes[i].id == parentId) {
                nodes[i].subordinates.splice(order, 0, targetList);
                break;
            }
        }
    }
    addTargetRedo(nodes: string | any[], target, targetList: number, order: number) {
        for(let i = 0; i < nodes.length; i ++) {
            if(nodes[i].subordinates.length > 0) {
                this.addTargetRedo(nodes[i].subordinates, target, targetList, order);
            }
            if(nodes[i].id == targetList) {
                target.subordinates = [];
                if(order == null) {
                    nodes[i].subordinates.push(target);
                } else {
                    nodes[i].subordinates.splice(order, 0, target);
                }
                break;
            }
        }
    }
    addChildrenRedo(nodes: string | any[], parent: number, childList: any[], order: number) {
        childList.reverse().forEach(element => {
            for(let i = 0; i < nodes.length; i ++) {
                if(nodes[i].subordinates.length > 0) {
                    this.addChildrenRedo(nodes[i].subordinates, parent, childList, order);
                }
                if(nodes[i].id == parent) {
                    nodes[i].subordinates.splice(order, 0, element);
                }
            }
        });
    }

    transferChildren(array: { subordinates: any[]; }, oldItemContainer: any[], i: any) {
        if(array.subordinates.length > 0) {
            this.childItemUndo= array.subordinates;
            array.subordinates.reverse().forEach(element => {
                oldItemContainer.splice(i, 0, element);
            });
            array.subordinates = [];
        } else this.childItemUndo = [];
    }
    getParentNodeId(id: number, nodesToSearch: Employee[], parentId: number): number {
        for (let node of nodesToSearch) {
            if (node.id === id) return parentId;
            let ret = this.getParentNodeId(id, node.subordinates, node.id);
            if (ret) return ret;
        }
        return null;
    }
    showDragInfo() {
        this.clearDragInfo();
        if (this.dropActionTodo) {
            this.document.getElementById("node-" + this.dropActionTodo.targetId).classList.add("drop-" + this.dropActionTodo.action);
        }
    }
    clearDragInfo(dropped = false) {
        if (dropped) {
            this.dropActionTodo = null;
        }
        this.document
            .querySelectorAll(".drop-before")
            .forEach(element => element.classList.remove("drop-before"));
        this.document
            .querySelectorAll(".drop-after")
            .forEach(element => element.classList.remove("drop-after"));
        this.document
            .querySelectorAll(".drop-inside")
            .forEach(element => element.classList.remove("drop-inside"));
    }
}
