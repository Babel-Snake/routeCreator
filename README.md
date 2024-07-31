## Route Specification Format

Each route is defined in the `data/route_specs.yaml` file using the following structure:

- `route_details`: Contains basic information about the route
  - `path`: The URL path for the route
  - `method`: The HTTP method (GET, POST, PUT, DELETE, PATCH)
  - `description`: A brief description of the route's purpose
- `logical_steps`: An array of steps the route should perform
  - `step`: A short name for the step
  - `description`: A more detailed description of what the step does
- `input`: An array of input parameters the route expects
  - `name`: The name of the input parameter
  - `type`: The data type of the parameter
  - `description`: A description of what the parameter is for
- `middleware`: An array of middleware names to be applied to the route

To add a new route, append a new entry to the `route_specs.yaml` file following this format.