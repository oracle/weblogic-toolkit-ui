// Copyright (c) 2020, 2025, Oracle and/or its affiliates.
// Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.

package org.todo.services.entity;

import jakarta.json.Json;
import jakarta.json.JsonObject;

public class Item {
  private int key;
  private String description;
  private boolean complete;

  public Item(int id) {
    key = id;
    complete = false;
  }

  public int id() {
    return key;
  }

  public String desc() {
    return description;
  }

  public Item desc(String value) {
    description = value;
    return this;
  }

  public boolean done() {
    return complete;
  }

  public Item done(boolean value) {
    complete = value;
    return this;
  }

  public JsonObject toJson() {
    return Json.createObjectBuilder()
        .add("id", id())
        .add( "description", desc())
        .add( "done", done())
        .build();
  }
}
