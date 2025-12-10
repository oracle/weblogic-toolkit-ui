// Copyright (c) 2020, 2025, Oracle and/or its affiliates.
// Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.

package org.todo.services.resource;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import javax.naming.NamingException;

import jakarta.json.JsonObject;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;

import org.todo.services.entity.Item;

@Path("/item")
public class ItemResource {

  public final static String selectSql = "select task, completed from ToDos where taskId = %s";
  public final static String deleteSql = "delete from ToDos where taskId = %s";
  public final static String insertSql = "insert into ToDos(task, completed) values('%s', false);";
  public final static String updateSql = "update ToDos set completed = %s where taskId = %s";

  @GET
  @Path("/{id}")
  @Produces("application/json")
  public JsonObject item(@PathParam("id") String id) {
    Item result = null;
    try (Connection conn = ItemsResource.datasource().getConnection()) {
      Statement statement = conn.createStatement();
      String queryStr = String.format(selectSql, id);
      System.out.println(queryStr);
      ResultSet resultSet = statement.executeQuery(queryStr);
      if (resultSet.next()) {
        String task = resultSet.getString("task");
        boolean complete = resultSet.getBoolean("completed");
        result = new Item(Integer.parseInt(id)).desc(task).done(complete);
      }
    } catch (SQLException | NamingException ex) {
      ex.printStackTrace();
    }
    return result == null ? null : result.toJson();
  }

  @DELETE
  @Path("/{id}")
  public void delete(@PathParam("id") String id) {
    runQuery(String.format(deleteSql, id));
  }

  @PUT
  @Path("/{taskDescription}")
  public void addNewItem(@PathParam("taskDescription") String description) {
    runQuery(String.format(insertSql, description));
  }

  @PUT
  @Path("/{id}/{status}")
  public void updateStatus(@PathParam("id") String id, @PathParam("status") String status) {
    runQuery(String.format(updateSql, id, status));
  }

  private void runQuery(String query) {
    try (Connection conn = ItemsResource.datasource().getConnection()) {
      Statement statement = conn.createStatement();
      System.out.println(query);
      statement.executeUpdate(query);
    } catch (SQLException | NamingException ex) {
      ex.printStackTrace();
    }
  }
}
