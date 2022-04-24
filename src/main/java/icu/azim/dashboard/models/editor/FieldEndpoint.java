package icu.azim.dashboard.models.editor;

import com.vaadin.flow.server.auth.AnonymousAllowed;
import dev.hilla.Endpoint;

@Endpoint
@AnonymousAllowed
public class FieldEndpoint {
    public Field get(){
        return new Field();
    }
}
