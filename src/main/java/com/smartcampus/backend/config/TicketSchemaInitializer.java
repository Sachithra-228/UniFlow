package com.smartcampus.backend.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.sql.SQLException;

@Slf4j
@Configuration
@RequiredArgsConstructor
public class TicketSchemaInitializer {

    private static final String TICKETS_TABLE = "tickets";
    private static final String BOOKINGS_TABLE = "bookings";
    private static final String BOOKING_COLUMN = "booking_id";
    private static final String BOOKING_FK = "fk_tickets_booking";
    private static final String TICKET_COMMENTS_TABLE = "ticket_comments";
    private static final String COMMENT_COLUMN = "comment";
    private static final String CONTENT_COLUMN = "content";

    private final DataSource dataSource;
    private final JdbcTemplate jdbcTemplate;

    @Bean
    ApplicationRunner ensureTicketBookingLinkSchema() {
        return args -> {
            try (Connection connection = dataSource.getConnection()) {
                DatabaseMetaData metaData = connection.getMetaData();

                if (!tableExists(metaData, TICKETS_TABLE) || !tableExists(metaData, BOOKINGS_TABLE)) {
                    log.debug("Ticket or booking table missing, skipping booking link schema verification");
                } else {
                    ensureTicketBookingLink(metaData);
                }

                if (tableExists(metaData, TICKET_COMMENTS_TABLE)) {
                    ensureTicketCommentColumns(metaData);
                }
            } catch (SQLException exception) {
                log.warn("Could not verify ticket schema", exception);
            }
        };
    }

    private void ensureTicketBookingLink(DatabaseMetaData metaData) throws SQLException {
        if (!columnExists(metaData, TICKETS_TABLE, BOOKING_COLUMN)) {
            jdbcTemplate.execute("ALTER TABLE tickets ADD COLUMN booking_id BIGINT");
            log.info("Added tickets.booking_id column");
        }

        if (!foreignKeyExists(metaData, TICKETS_TABLE, BOOKING_FK)) {
            jdbcTemplate.execute(
                    "ALTER TABLE tickets ADD CONSTRAINT fk_tickets_booking " +
                            "FOREIGN KEY (booking_id) REFERENCES bookings(id)"
            );
            log.info("Added foreign key fk_tickets_booking on tickets.booking_id");
        }
    }

    private void ensureTicketCommentColumns(DatabaseMetaData metaData) throws SQLException {
        if (!columnExists(metaData, TICKET_COMMENTS_TABLE, COMMENT_COLUMN)) {
            jdbcTemplate.execute("ALTER TABLE ticket_comments ADD COLUMN comment VARCHAR(2000)");
            log.info("Added ticket_comments.comment column");
        }

        if (!columnExists(metaData, TICKET_COMMENTS_TABLE, CONTENT_COLUMN)) {
            jdbcTemplate.execute("ALTER TABLE ticket_comments ADD COLUMN content VARCHAR(2000)");
            log.info("Added ticket_comments.content column");
        }

        jdbcTemplate.execute("UPDATE ticket_comments SET comment = content WHERE comment IS NULL AND content IS NOT NULL");
        jdbcTemplate.execute("UPDATE ticket_comments SET content = comment WHERE content IS NULL AND comment IS NOT NULL");
    }

    private boolean tableExists(DatabaseMetaData metaData, String tableName) throws SQLException {
        try (ResultSet tables = metaData.getTables(null, null, tableName, new String[]{"TABLE"})) {
            return tables.next();
        }
    }

    private boolean columnExists(DatabaseMetaData metaData, String tableName, String columnName) throws SQLException {
        try (ResultSet columns = metaData.getColumns(null, null, tableName, columnName)) {
            return columns.next();
        }
    }

    private boolean foreignKeyExists(DatabaseMetaData metaData, String tableName, String foreignKeyName) throws SQLException {
        try (ResultSet foreignKeys = metaData.getImportedKeys(null, null, tableName)) {
            while (foreignKeys.next()) {
                String currentName = foreignKeys.getString("FK_NAME");
                if (currentName != null && foreignKeyName.equalsIgnoreCase(currentName)) {
                    return true;
                }
            }
            return false;
        }
    }
}
