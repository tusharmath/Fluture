function List(head, tail){
  this.head = head;
  this.tail = tail;
  this.size = tail.size + 1;
}

List.prototype.isEmpty = false;

List.prototype.cons = function List$cons(x){
  return new List(x, this);
};

function Empty(){}

Empty.prototype = Object.create(List.prototype);

Empty.prototype.isEmpty = true;
Empty.prototype.head = null;
Empty.prototype.tail = null;
Empty.prototype.size = 0;

export default new Empty;
