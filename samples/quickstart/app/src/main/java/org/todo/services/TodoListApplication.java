// Copyright (c) 2020, 2023, Oracle and/or its affiliates.
// Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.

package org.todo.services;

import java.util.HashSet;
import java.util.Set;
import javax.ws.rs.ApplicationPath;
import javax.ws.rs.core.Application;

import org.todo.services.resource.ItemResource;
import org.todo.services.resource.ItemsResource;

@ApplicationPath("/rest")
public class TodoListApplication extends Application {
  public Set<Class<?>> getClasses() {
    Set<Class<?>> s = new HashSet<>();
    s.add(ItemsResource.class);
    s.add(ItemResource.class);
    return s;
  }
}
