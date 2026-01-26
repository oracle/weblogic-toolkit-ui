// Copyright (c) 2020, 2025, Oracle and/or its affiliates.
// Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.

package org.todo.services.resource;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;
import javax.naming.InitialContext;
import javax.naming.NamingException;
import javax.sql.DataSource;

import jakarta.json.Json;
import jakarta.json.JsonArray;
import jakarta.json.JsonArrayBuilder;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import org.todo.services.entity.Item;

/**
 * REST service for the To-Do list application using MySQL DB.
 * /items retrieves the full list of tasks
 * /items/init drops the table, creates the table, and loads the table with some starting tasks
 */
@Path("/items/")
@Produces(MediaType.APPLICATION_JSON)
public class ItemsResource {

  public static DataSource datasource() throws NamingException {
    InitialContext ctx = new InitialContext();
    return (DataSource) ctx.lookup("jdbc/ToDoDB");
  }

  public List<Item> items() {
    List<Item> result = new ArrayList<>();

    try (Connection conn = datasource().getConnection()){
      Statement statement = conn.createStatement();
      ResultSet resultSet = statement.executeQuery("select taskId, task, completed from ToDos");
      while (resultSet.next()) {
        int id = resultSet.getInt("taskId");
        String task = resultSet.getString("task");
        boolean complete = resultSet.getBoolean("completed");
        result.add(new Item(id).desc(task).done(complete));
      }
    } catch (SQLException | NamingException ex) {
      ex.printStackTrace();
    }
    return result;
  }

  @GET
  public JsonArray itemsJson() {
    JsonArrayBuilder result = Json.createArrayBuilder();
    for (Item item : items()) {
      result.add(item.toJson());
    }
    return result.build();
  }

  @GET
  @Path("/drop/")
  @Produces(MediaType.TEXT_PLAIN)
  public Response dropTable() {
    try (Connection conn = datasource().getConnection()) {
      Statement stmt = conn.createStatement();

      String dropTable = "drop table ToDos;";
      System.out.println(dropTable);
      stmt.executeUpdate(dropTable);
    } catch (SQLException | NamingException ex) {
      // ok to fail, table may not exist yet.
      return Response.ok().entity(ex.getLocalizedMessage() + "\n").build();
    }
    return Response.ok().entity("ToDos table dropped.\n").build();
  }

  @GET
  @Path("/init/")
  @Produces(MediaType.TEXT_PLAIN)
  public Response initTable() {
    dropTable();
    try (Connection conn = datasource().getConnection()){
      Statement stmt = conn.createStatement();

      String createTable = "create table ToDos (" +
          "taskId INT NOT NULL AUTO_INCREMENT, " +
          "task VARCHAR(200) NOT NULL, " +
          "completed BOOLEAN," +
          "constraint todo_pk PRIMARY KEY (taskId));";

      System.out.println(createTable);
      stmt.executeUpdate(createTable);

      String[] tasks = {"Install Verrazzano", "Move ToDo List to the cloud", "Celebrate", "Clean off my desk"};
      for (String task : tasks) {
        String insert = String.format(ItemResource.insertSql, task);
        System.out.println(insert);
        stmt.executeUpdate(insert);
      }

    } catch (SQLException | NamingException ex) {
      ex.printStackTrace();
      return Response.serverError().entity("ERROR: " + ex.getLocalizedMessage() + "\n").build();
    }
    return Response.ok().entity("ToDos table initialized.\n").build();
  }
}
