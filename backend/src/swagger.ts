export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Umurava AI Screener API",
    version: "1.0.0",
  },
  servers: [{ url: "http://localhost:5000" }],
  paths: {
    "/health": {
      get: {
        summary: "Health check",
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { status: { type: "string" } },
                  required: ["status"],
                },
              },
            },
          },
        },
      },
    },
    "/api/jobs": {
      get: {
        summary: "List jobs",
        parameters: [
          {
            name: "status",
            in: "query",
            required: false,
            schema: { type: "string" },
          },
        ],
        responses: { "200": { description: "OK" } },
      },
      post: {
        summary: "Create job",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object" } } },
        },
        responses: { "201": { description: "Created" }, "200": { description: "OK" } },
      },
    },
    "/api/jobs/{id}": {
      get: {
        summary: "Get job by id",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: { "200": { description: "OK" }, "404": { description: "Not Found" } },
      },
      delete: {
        summary: "Delete job",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: { "200": { description: "OK" }, "404": { description: "Not Found" } },
      },
    },
    "/api/jobs/{id}/status": {
      patch: {
        summary: "Set job status",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object" } } },
        },
        responses: { "200": { description: "OK" }, "404": { description: "Not Found" } },
      },
    },
    "/api/applicants": {
      get: {
        summary: "List applicants",
        responses: { "200": { description: "OK" } },
      },
    },
    "/api/applicants/upload": {
      post: {
        summary: "Upload applicants file",
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  file: { type: "string", format: "binary" },
                },
                required: ["file"],
              },
            },
          },
        },
        responses: { "200": { description: "OK" }, "400": { description: "Bad Request" } },
      },
    },
    "/api/applicants/{id}": {
      get: {
        summary: "Get applicant by id",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: { "200": { description: "OK" }, "404": { description: "Not Found" } },
      },
      delete: {
        summary: "Delete applicant",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: { "200": { description: "OK" }, "404": { description: "Not Found" } },
      },
    },
    "/api/jobs/{jobId}/resumes/ingest": {
      post: {
        summary: "Ingest resumes (extract text only)",
        parameters: [
          {
            name: "jobId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  files: {
                    type: "array",
                    items: { type: "string", format: "binary" },
                  },
                },
                required: ["files"],
              },
            },
          },
        },
        responses: { "200": { description: "OK" }, "400": { description: "Bad Request" } },
      },
    },
    "/api/jobs/{jobId}/resumes/parse": {
      post: {
        summary: "Parse resumes with Gemini",
        parameters: [
          {
            name: "jobId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  files: {
                    type: "array",
                    items: { type: "string", format: "binary" },
                  },
                },
                required: ["files"],
              },
            },
          },
        },
        responses: {
          "200": { description: "OK" },
          "400": { description: "Bad Request" },
          "404": { description: "Not Found" },
        },
      },
    },
  },
} as const;
